import bluebird from 'bluebird';
import csv from 'csv-parse';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as _ from 'lodash';
import {fs} from 'mz';
import nconf from 'nconf'
import * as R from 'ramda';
import * as shortid from 'shortid';
import 'source-map-support/register'
// import {Category, discoverCategories} from '../lib/categories';
import * as firestore from '../lib/firestore';
import {DETxn, journalToLedger, TxnItem} from '../lib/txns';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';

global.Promise = bluebird;
(Promise as any).config({
  longStackTraces: true
})

/* tslint:disable:no-var-requires */
/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

const IncomePayeesReq = require('./income_payees.json');
const AssetAccountsReq = require('./asset_accounts.json');
const LiabilityAccountsReq = require('./liability_accounts.json');

nconf.argv().env();

function amountOfStr(str: string) {
  return parseInt(
    str.replace('.', '').replace(',', ''),
    10
  );
}

async function readCsv(file: string): Promise<GoodBudgetRow[]> {
  const contents = await fs.readFile(file);
  return new Promise<GoodBudgetRow[]>((resolve, reject) => {
    csv(contents.toString(), {columns: true, escape: '\\'}, (err: any, data: any) => {
      /* tslint:disable-next-line:curly */
      if (err) return reject(err);
      return resolve(data);
    })
  })
}

export function parseCategories(row: {[key: string]: any}): {[key: string]: number} {
  /* tslint:disable-next-line:curly */
  if (row.Details === '') return {[row.Envelope]: amountOfStr(row.Amount)};
  return (
    row.Envelope ? {[row.Envelope]: amountOfStr(row.Amount)} :
    row.Details.split('||').
      map((detail: string) => detail.split('|')).
      reduce((acc: {[key: string]: number}, [category, amount]: [string, string]) =>
        ({...acc, [category]: amountOfStr(amount)})
      , {})
  );
}

/**
 * GoodBudget's export breaks account transfers into two transactions, so we'd
 * import double transfers (or transfers with no payees) if we imported as-is
 */
function mergeAccountTransfers(gbRows: any): Array<GoodBudgetRow | GoodBudgetTxfr> {
  const newRows: GoodBudgetRow[] = [];
  const txfrs: {[key: string]: GoodBudgetRow[]} = {};
  gbRows.forEach((row: any) => {
    /* tslint:disable-next-line:curly */
    if (typeForRow(row) !== 'accountTransfer') return newRows.push(row);

    const key = `${row.Date}-${row.Amount.replace('-', '')}`;
    const arr = txfrs[key];
    txfrs[key] = [...(arr || []), row];
    return;
  });

  Object.values(txfrs).forEach((txfrRows: any[]) => {
    while (txfrRows.length > 0) {
      const txfrId = shortid.generate();
      const from = txfrRows.find((row) => parseFloat(row.Amount) < 0);
      const to = txfrRows.find((row) => parseFloat(row.Amount) > 0);
      console.log(txfrRows.length);

      // Remove the items from the array
      txfrRows.splice(txfrRows.indexOf(from), 1);
      txfrRows.splice(txfrRows.indexOf(to), 1);

      newRows.push({...from, Name: to.Account, txfrId});
      newRows.push({...to, Name: from.Account, txfrId});
      }
  })

  return newRows;
}

function rowIsAccountTransfer(row: GoodBudgetRow) {
  return (
    row.Notes === 'Account Transfer' ||
    (row.Details === '' && row.Envelope === '')
  );
}

export function typeForRow(row: GoodBudgetRow) {
  if (row.Notes === 'Envelope Transfer' || (row.Account === '' && row.Envelope !== '[Unallocated]')) {
    return 'envelopeTransfer';
  } else if (rowIsAccountTransfer(row)) {
    return 'accountTransfer';
  } else if (row.Envelope !== '' || row.Details !== '') {
    return 'transaction';
  } else {
    throw new Error(`No categorzation for row: ${JSON.stringify(row)}`)
  }
}

/**
 * Given a row, returns the category name for the row's Account
 */
export function nameAccount(AssetAccounts: string[], LiabilityAccounts: string[], row: GoodBudgetRow): string {
  if (AssetAccounts.indexOf(row.Account) !== -1) {
    return `Assets:${row.Account}`;
  } else if (LiabilityAccounts.indexOf(row.Account) !== -1) {
    return `Liabilities:${row.Account}`;
  } else {
    throw new Error(`Unrecognized account: ${row.Account}`);
  }
}

function isIncome(IncomePayees: string[], payee: string) {
  return IncomePayees.indexOf(payee) !== -1;
}

/** Given a row, returns the envelope name the transaction is from */
export function nameOutboundCategory(
  AssetAccounts: string[],
  LiabilityAccounts: string[],
  IncomePayees: string[],
  row: GoodBudgetRow
): string {
  if (isIncome(IncomePayees, row.Name)) {
    return `Income:Salary`;
  } else {
    return nameAccount(AssetAccounts, LiabilityAccounts, row);
  }
}

export function mkAccountItems(
  AssetAccounts: string[],
  LiabilityAccounts: string[],
  IncomePayees: string[],
  row: GoodBudgetRow
): TxnItem[] {
  if (isIncome(IncomePayees, row.Name)) {
    return [
      {account: 'Income:Salary', amount: -amountOfStr(row.Amount)},
      {account: nameAccount(AssetAccounts, LiabilityAccounts, row), amount: amountOfStr(row.Amount)}, ];
  }

  return [{account: nameAccount(AssetAccounts, LiabilityAccounts, row), amount: amountOfStr(row.Amount)}];
}

export function mkCategoryItems(
  [category, amount]: [string, number],
  isFill: boolean,
): TxnItem[] {
  if (isFill) {
    return [
      {account: `Liabilities:${category}`, amount: -amount},
      {account: `Expenses:${category}`, amount},
    ]
  }

  return [{account: `Liabilities:${category}`, amount: -amount}];
}

export function ItemsForRow(
  AssetAccounts: string[],
  LiabilityAccounts: string[],
  IncomePayees: string[],
  row: GoodBudgetRow
): TxnItem[] {
  const i = isIncome(IncomePayees, row.Name);
  return _.flatten([
    ...mkAccountItems(AssetAccounts, LiabilityAccounts, IncomePayees, row),
    ...Object.entries(parseCategories(row)).
      map(([category, amount]) => mkCategoryItems([category, amount], i)),
  ]);
}

export function rowToTxn(
  AssetAccounts: string[],
  LiabilityAccounts: string[],
  IncomePayees: string[],
  row: GoodBudgetRow
): DETxn | null {
  /* tslint:disable-next-line:curly */
  if (row.Account === '[none]') return null;  // It's a fill

  const type = typeForRow(row);

  /* tslint:disable-next-line:curly */
  if (type === 'envelopeTransfer') return null;

  const items = ItemsForRow(AssetAccounts, LiabilityAccounts, IncomePayees, row);
  return {
    id: shortid.generate(),
    date: new Date(row.Date),
    payee: row.Name,
    memo: row.Notes,
    items: R.fromPairs(items.map(
      ({account, amount}): [string, number] => [account, amount]
    ))
  }
}

function nullFilter<T>(item: T | null | undefined): item is T {
  return Boolean(item);
}

/*
async function learnCategories(txnItems: TxnItem[]) {
  const categories = discoverCategories(txnItems);

  const collRef = firebase.firestore().collection('users').doc(nconf.get('email')).collection('categories');
  const batch = firebase.firestore().batch();
  categories.forEach((category) => {
    const cat: Category = {name: category, interval: 'weekly', target: 1, sortOrder: 0, group: null}
    batch.set(
      collRef.doc(category),
      cat
    )
  });
  await batch.commit();
}
*/

async function writeToFirebase(txns: DETxn[]) {
  const chunks = _.chunk(txns, 1);
  const db = firebase.firestore().collection('users').doc(nconf.get('email'));
  const collRef = db.collection('txns');
  for (const chunk of chunks) {
    const batch = firebase.firestore().batch();
    for (const txn of chunk) {
      batch.set(collRef.doc(txn.id), txn);
    }
    await batch.commit();

    console.log(chunk.map(R.prop('items')).map(R.toPairs));

    try {
      await Promise.all(_.flatten(chunk.map((txn) =>
        Object.entries(txn.items).map(([account, amount]) =>
          firestore.updateAccountBalance(db.collection('accounts'), {account, amount})
        )
      )));
      console.log(`Wrote ${chunk.length}`);
    } catch(ex) {
      console.error('Error updating entries')
      throw ex;
    }
  }
}

function isMagicAccount(txnItem: TxnItem) {
  return AssetAccountsReq.map((acct: string) => `Assets:${acct}`).indexOf(txnItem.account) !== -1 ||
    LiabilityAccountsReq.map((acct: string) => `Liabilities: ${acct}`).indexOf(txnItem.account) !== -1;
}

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file', 'email']);

  const rows = await readCsv(nconf.get('file'));
  const txns: DETxn[] =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]')).
    map((row) => rowToTxn(AssetAccountsReq, LiabilityAccountsReq, IncomePayeesReq, row)).
    filter(nullFilter);

  const txnItems = journalToLedger(txns);
  const sum = txnItems.map(R.prop('amount')).reduce(R.add);
  /* tslint:disable-next-line:curly */
  if (sum !== 0) throw new Error(`Expected zero-balanced ledger, got ${sum}`);

  const groups = R.groupBy((txnItem) => txnItem.account, txnItems.filter(isMagicAccount));
  console.log('keys', Object.keys(groups));
  console.log(
    Object.values(groups).
    map((items) => items.map(R.prop('amount')).reduce(R.add, 0)).
    map(R.divide(100))
  );

  await writeToFirebase(txns);

  // await learnCategories(txnItems);
}
if (nconf.get('run')) {
  /* tslint:disable */
  main().then(console.log);
  /* tslint:enable */
}