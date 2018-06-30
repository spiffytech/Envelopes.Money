import bluebird from 'bluebird';
import csv from 'csv-parse';
// import * as firebase from 'firebase/app';
// import 'firebase/firestore';
import * as _ from 'lodash';
import {fs} from 'mz';
import nconf from 'nconf'
import R from 'ramda';
import * as shortid from 'shortid';
import 'source-map-support/register'
// import {Category, discoverCategories} from '../lib/categories';
// import * as firestore from '../lib/firestore';
import * as Couch from '../lib/couch';
import {TxnItem} from '../lib/txns';
import * as Txns from '../lib/txns';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';

global.Promise = bluebird;
(Promise as any).config({
  longStackTraces: true
})

/* tslint:disable:no-var-requires */
/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

require('dotenv').config();
console.log('host', process.env.COUCH_HOST);

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

export function parseCategories(row: GoodBudgetRow): {[key: string]: number} {
  /* tslint:disable-next-line:curly */
  if (row.Details === '') return {[row.Envelope]: amountOfStr(row.Amount)};
  return (
    row.Envelope ? {[row.Envelope]: amountOfStr(row.Amount)} :
    row.Details.split('||').
      map((detail: string) => detail.split('|')).
      reduce((acc: {[key: string]: number}, [category, amount]) =>
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
    return 'banktxn';
  } else {
    throw new Error(`No categorzation for row: ${JSON.stringify(row)}`)
  }
}

/**
 * Given a row, returns the category name for the row's Account
 */
export function nameAccount(AssetAccounts: string[], LiabilityAccounts: string[], row: GoodBudgetRow | string): string {
  const account = typeof row === 'string' ? row : row.Account;

  if (AssetAccounts.indexOf(account) !== -1) {
    return `Assets:${account}`;
  } else if (LiabilityAccounts.indexOf(account) !== -1) {
    /* tslint:disable-next-line:curly */
    if (!account || account === '') throw new Error(`Invalid row, ${row}`);
    return `Liabilities:${account}`;
  } else {
    throw new Error(`Unrecognized account: ${account}`);
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
  [category, amount, name]: [string, number, string],
  isFill: boolean,
  AssetAccounts: string[],
  LiabilityAccounts: string[],
): TxnItem[] {
  /* tslint:disable-next-line:curly */
  if (isFill) {
    return [
      {account: `Liabilities:${category}`, amount: -amount},
      {account: `Expenses:${category}`, amount},
    ]
  }

  /* tslint:disable-next-line:curly */
  if (category === '') return [{account: nameAccount(AssetAccounts, LiabilityAccounts, name), amount: -amount}];  // Probably an account transfer

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
      map(([category, amount]) => mkCategoryItems([category, amount, row.Name], i, AssetAccounts, LiabilityAccounts)),
  ]);
}

export function rowToBankTxn(row: GoodBudgetRow): Txns.BankTxn {
  return {
    _id: shortid.generate(),
    date: new Date(row.Date),
    amount: amountOfStr(row.Amount),
    account: row.Account,
    payee: row.Name,
    memo: row.Notes,
    categories: parseCategories(row),
    type: 'banktxn',
  }
}

export function rowToAccountTxfr(row: GoodBudgetTxfr): Txns.AccountTransfer {
  return {
    _id: shortid.generate(),
    date: new Date(row.Date),
    amount: amountOfStr(row.Amount),
    memo: row.Notes,
    from: row.Account,
    to: row.Name,
    txfrId: row.txfrId,
    type: 'accountTransfer',
  };
}

export function rowToEnvelopeTransfer(row: GoodBudgetRow): Txns.EnvelopeTransfer {
  throw new Error('Conversion to envelope transfers is not implemented yet');
}

export function rowToTxn(
  row: GoodBudgetRow
): Txns.Txn {
  const type = typeForRow(row);

  if (type === 'accountTransfer') return rowToAccountTxfr(row as GoodBudgetTxfr);
  if (type === 'envelopeTransfer') return rowToEnvelopeTransfer(row);
  if (type === 'banktxn') return rowToBankTxn(row);
  throw new Error('Did not find type for row')
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

/*
async function writeToFirebase(txns: Txns.Txn[]) {
  const txnsSorted = txns.sort((txn1, txn2) => txn1.date < txn2.date ? -1 : 1);
  const chunks = _.chunk(txnsSorted, 1);
  const db = firebase.firestore().collection('users').doc(nconf.get('email'));
  const collRef = db.collection('txns');
  let total = 0;
  for (const chunk of chunks) {
    const batch = firebase.firestore().batch();
    for (const txn of chunk) {
      batch.set(collRef.doc(txn.id), txn);
    }
    await batch.commit();

    try {
      console.log(JSON.stringify(
        chunk.filter(Txns.touchesBank).map((txn) => [txn.date, Txns.accountsForTxn(txn)])
      ));
      await Promise.all(
        _.flatten(
          chunk.
          filter(Txns.touchesBank).
          map(Txns.accountsForTxn)
        ).
        map(({account, amount}) =>
          firestore.updateAccountBalance(db.collection('accounts'), {account, amount})
        )
      );

      await Promise.all(
        _.flatten(
          chunk.
          filter(Txns.isBankTxn).
          map((txn) => Object.entries(txn.categories).map(([category, amount]) => ({account: category, amount})))
        ).
        map(({account, amount}) =>
          firestore.updateAccountBalance(db.collection('categories'), {account, amount})
        )
      );

      await Promise.all(
        chunk.
        filter(Txns.isBankTxn).
        filter(R.pipe(R.prop('payee'), R.complement(R.equals('')))).
        map((txn) => txn.payee).
        map((payee) =>
          firestore.updatePayee(db.collection('payees'), payee)
        )
      );

      total += chunk.length;
      console.log(`Wrote ${total}`);
    } catch(ex) {
      console.error('Error updating entries')
      throw ex;
    }
  }
}
*/

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file', 'email']);

  const rows = await readCsv(nconf.get('file'));
  const txns: Txns.Txn[] =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]')).
    filter((row) => typeForRow(row) !== 'envelopeTransfer').
    filter((row) => row.Account !== '[none]').  // It's a fill
    map((row) => rowToTxn(row)).
    filter(nullFilter);

  // const groups = R.groupBy((txnItem) => txnItem.account, txnItems.filter(isMagicAccount));
  // console.log('keys', Object.keys(groups));
  /*c
  console.log(
    Object.values(groups).
    map((items) => items.map(R.prop('amount')).reduce(R.add)).
    map(R.divide(100))
  );
  */
  /*
  console.log(
    Object.values(groups).
    map((items) => items.map(R.prop('amount')).reduce(R.add)).
    map((n) => n / 100)
  );
  */

  const txnItems = _.flatten(txns.filter(Txns.touchesBank).map(Txns.accountsForTxn));
  console.log(
    txnItems.filter(({account}) => account === 'SECU Checking').map(({amount}) => amount).reduce(R.add) / 100,
    txnItems.filter(({account}) => account === 'AmEx').map(({amount}) => amount).reduce(R.add) / 100,
  )

  // await writeToFirebase(txns);

  // await learnCategories(txnItems);

  const remote = await Couch.mkRemoteDB(process.env.COUCH_USER!, process.env.COUCH_PASS!);
  try {
    console.log(remote === null);
    /*
    const chunks = _.chunk(txns, 500);
    for (const chunk of chunks) {
      await Couch.bulkImport(remote, chunk);
    }
    */
  } catch(ex) {
    console.log('error')
    console.error(ex)
    console.error(JSON.stringify(ex))
  }
}
if (nconf.get('run')) {
  main();
}
