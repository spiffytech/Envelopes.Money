import _ from 'lodash';
import csv from 'csv-parse';
import firebase from 'firebase/app';
import 'firebase/firestore';
import {fs} from 'mz';
import nconf from 'nconf'
import * as shortid from 'shortid';
import 'source-map-support/register'
import {BankEvent, Txn, AccountTransfer, LedgerEvent, isTxn, isTxfr, sumAccountTotal} from '../lib/txns';
import {discoverCategories, Category} from '../lib/categories';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';
import {groupBy} from '../lib/utils';

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

function parseCategories(row: {[key: string]: any}) {
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

export function rowToTxn(row: GoodBudgetRow): Txn | AccountTransfer | null {
  if (row.Account === '[none]') return null;  // It's a fill

  if (row.Name === 'Sandi Metz') console.log(row);

  const type = typeForRow(row);

  //console.log(row, row.Amount);
  if (amountOfStr(row.Amount) === 600000) console.log(row)
  if (type === 'envelopeTransfer') return null;

  const categories = row.Details !== '' ? parseCategories(row) : {[row.Envelope]: amountOfStr(row.Amount)};

  const ret: LedgerEvent = {
    id: shortid.generate(),
    date: new Date(row.Date),
    payee: row.Name,
    account: row.Account,
    memo: row.Notes,
    amount: amountOfStr(row.Amount),
  };
  
  if (type === 'transaction') return {...ret, categories, type};

  return {...ret, txfrId: (row as GoodBudgetTxfr).txfrId, type};
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

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file', 'email']);

  const rows = await readCsv(nconf.get('file'));
  const txns: BankEvent[] =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]')).
    map(rowToTxn).filter(nullFilter);

  const groups = groupBy(txns.filter((txn) => txn.account), ((txn) => txn.account));
  console.log(Object.values(groups).map(sumAccountTotal).map((n) => n / 100))

  const emptyCats = txns.filter(isTxn).filter((txn) => txn.categories['']);
  console.log(emptyCats);
  if (emptyCats.length > 0) throw new Error('Empty category names');

  /*
  console.log(
    txns.
    filter(isTxn).
    reduce(sumByCategory('[Unallocated]'), 0)
  );
  */

  console.log(txns.filter(isTxfr).filter((txn) => !txn.txfrId))

  await writeToFirebase(txns);
  await learnCategories(txns);
}
if (nconf.get('run')) {
  /* tslint:disable */
  main().then(console.log);
  /* tslint:enable */
}