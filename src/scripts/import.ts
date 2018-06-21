import _ from 'lodash';
import csv from 'csv-parse';
import firebase from 'firebase/app';
import 'firebase/firestore';
import {fs} from 'mz';
import nconf from 'nconf'
import * as shortid from 'shortid';
import 'source-map-support/register'
import {DETxn, BankEvent, groupByAccount, Txn, TxnItem, journalToLedger} from '../lib/txns';
import {discoverCategories, Category} from '../lib/categories';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';
import {groupBy, objectFromEntries} from '../lib/utils';

const firebaseConfig = require('../../firebase.config.json');
firebase.initializeApp(firebaseConfig);

nconf.argv().env();

function amountOfStr(str: string) {
  return parseInt(
    str.replace('.', '').
    replace(',', '')
  );
}

async function readCsv(file: string): Promise<GoodBudgetRow[]> {
  const contents = await fs.readFile(file);
  return new Promise<GoodBudgetRow[]>((resolve, reject) => {
    csv(contents.toString(), {columns: true, escape: '\\'}, (err: any, data: any) => {
      if (err) return reject(err);
      return resolve(data);
    })
  })
}

export function parseCategories(row: {[key: string]: any}): {[key: string]: number} {
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
function mergeAccountTransfers(rows: any): (GoodBudgetRow | GoodBudgetTxfr)[] {
  const newRows: GoodBudgetRow[] = [];
  const txfrs: {[key: string]: GoodBudgetRow[]} = {};
  rows.forEach((row: any) => {
    if (typeForRow(row) !== 'accountTransfer') return newRows.push(row);

    const key = `${row.Date}-${row.Amount.replace('-', '')}`;
    const arr = txfrs[key];
    txfrs[key] = [...(arr || []), row];
  });

  Object.values(txfrs).forEach((rows: any[]) => {
    while (rows.length > 0) {
      const txfrId = shortid.generate();
      const from = rows.find((row) => parseFloat(row.Amount) < 0);
      const to = rows.find((row) => parseFloat(row.Amount) > 0);
      console.log(rows.length);

      // Remove the items from the array
      rows.splice(rows.indexOf(from), 1);
      rows.splice(rows.indexOf(to), 1);

      newRows.push({...from, Name: to.Account, txfrId});
      newRows.push({...to, Name: from.Account, txfrId});
      }
  })

  return newRows;
}

function rowIsAccountTransfer(row: GoodBudgetRow) {
  //return row.Notes === 'Account Transfer' || (row.Name === '' && row.Envelope !== '[Unallocated]');
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

const IncomePayees = require('./income_payees.json');
const AssetAccounts = require('./asset_accounts.json');
const LiabilityAccounts = require('./liability_accounts.json');

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
  if (row.Account === '[none]') return null;  // It's a fill

  const type = typeForRow(row);

  if (type === 'envelopeTransfer') return null;

  const items = ItemsForRow(AssetAccounts, LiabilityAccounts, IncomePayees, row);
  return {
    id: shortid.generate(),
    date: new Date(row.Date),
    payee: row.Name,
    memo: row.Notes,
    items: objectFromEntries(items.map(({account, amount}) => [account, amount] as [string, number]))
  }
}

function nullFilter<T>(item: T | null | undefined): item is T {
  return Boolean(item);
}

function sumByCategory(category: string) {
  return (acc: number, item: Txn) => acc + (item.categories[category] || 0)
}

async function learnCategories(txns: BankEvent[]) {
  const categories = discoverCategories(txns);

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

async function writeToFirebase(txns: BankEvent[]) {
  const chunks = _.chunk(txns, 500);
  const collRef = firebase.firestore().collection('users').doc(nconf.get('email')).collection('txns');
  for (let chunk of chunks) {
    const batch = firebase.firestore().batch();
    for (let txn of chunk) {
      batch.set(collRef.doc(txn.id), txn);
    }
    await batch.commit();
    console.log('Wrote 500');
  }
}

function isMagicAccount(txnItem: TxnItem) {
  return AssetAccounts.map((acct: string) => `Assets:${acct}`).indexOf(txnItem.account) !== -1 ||
    LiabilityAccounts.map((acct: string) => `Liabilities: ${acct}`).indexOf(txnItem.account) !== -1;
}

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file', 'email']);

  const rows = await readCsv(nconf.get('file'));
  const txns: DETxn[] =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]')).
    map((row) => rowToTxn(AssetAccounts, LiabilityAccounts, IncomePayees, row)).
    filter(nullFilter);

  const txnItems = journalToLedger(txns);
  const sum = txnItems.reduce((acc, item) => acc + item.amount, 0);
  if (sum !== 0) throw new Error(`Expected zero-balanced ledger, got ${sum}`);

  const groups = groupBy(txnItems.filter(isMagicAccount), (txnItem) => txnItem.account);

  console.log('keys', Object.keys(groups));

  console.log(
    Object.values(groups).
    map((items) => items.reduce((acc, i) => acc + i.amount, 0)).
    map((total) => total / 100)
  );

  /*
  console.log(
    txns.
    filter(isTxn).
    reduce(sumByCategory('[Unallocated]'), 0)
  );
  */

  //await writeToFirebase(txns);
  //await learnCategories(txns);
}
if (nconf.get('run')) {
  /* tslint:disable */
  main().then(console.log);
  /* tslint:enable */
}