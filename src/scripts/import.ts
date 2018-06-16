import _ from 'lodash';
import csv from 'csv-parse';
import {fs} from 'mz';
import nconf from 'nconf'
import * as shortid from 'shortid';
import 'source-map-support/register'

nconf.argv().env().required(['file']);

interface LedgerEvent {
  date: Date;
  payee: string;
  account: string;
  amount: number;
  memo: string;
}

interface EnvelopeTransfer {
  date: Date;
  amount: number;
  memo: string;
  categories: {[key: string]: number};
  type: 'envelopeTransfer';
}

interface Txn extends LedgerEvent {
  categories: {[key: string]: number};
  type: 'transaction';
}

interface AccountTransfer extends LedgerEvent {
  txfrId: string;
  type: 'accountTransfer';
}

type BankEvent = Txn | AccountTransfer;

function amountOfStr(str: string) {
  return parseInt(
    str.replace('.', '').
    replace(',', '')
  );
}

async function readCsv(file: string): Promise<{[key: string]: any}[]> {
  const contents = await fs.readFile(file);
  return new Promise<{[key: string]: any}[]>((resolve, reject) => {
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
function mergeAccountTransfers(rows: any): {[key: string]: any} {
  const newRows: {[key: string]: any} = [];
  const txfrs: {[key: string]: any} = {};
  rows.forEach((row: any) => {
    if (row.Notes !== 'Account Transfer') return newRows.push(row);

    const key = `${row.Date}-${row.Amount.replace('-', '')}`;
    const arr = txfrs[key];
    txfrs[key] = [...(arr || []), row];
  });

  Object.values(txfrs).forEach((rows: any[]) => {
    const txfrId = shortid.generate();
    const from = rows.find((row) => parseFloat(row.Amount) < 0);
    const to = rows.find((row) => parseFloat(row.Amount) > 0);

    newRows.push({...from, Name: to.Account, txfrId});
    newRows.push({...to, Name: from.Account, txfrId});
  })

  return newRows;
}

function rowToTxn(row: {[key: string]: any}): Txn | AccountTransfer | null {
  if (row.Account === '[none]') return null;  // It's a fill

  const type =
    row.Notes === 'Account Transfer' ?
    'accountTransfer' :
    row.Notes === 'Envelope Transfer' || (row.Account === '' && row.Envelope !== '[Unallocated]') ?
      'envelopeTransfer' :
      'transaction';

  //console.log(row, row.Amount);
  if (amountOfStr(row.Amount) === 600000) console.log(row)
  if (type === 'envelopeTransfer') return null;

  const categories = row.Details !== '' ? parseCategories(row) : {[row.Envwelope]: row.Amount};

  const ret: LedgerEvent = {
    date: new Date(row.Date),
    payee: row.Name,
    account: row.Account,
    memo: row.Notes,
    amount: amountOfStr(row.Amount),
  };
  
  if (type === 'transaction') return {...ret, categories, type};

  return {...ret, txfrId: row.txfrId, type};
}

function groupBy<T>(arr: T[], fn: (item: T) => string): {[key: string]: T[]} {
  return arr.reduce(
    (acc, item) => ({...acc, [fn(item)]: [...(acc[fn(item)] || []), item]}),
    {} as {[key: string]: T[]}
  )
}

function nullFilter<T>(item: T | null | undefined): item is T {
  return Boolean(item);
}

function sumAccountTotal(txns: BankEvent[]) {
  return txns.reduce((total, txn) => total + txn.amount, 0);
}

async function main() {
  const rows = await readCsv(nconf.get('file'));
  const txns: BankEvent[] = mergeAccountTransfers(rows).map(rowToTxn).filter(nullFilter);

  const groups = groupBy(txns.filter((txn) => txn.account), ((txn) => txn.account!));
  console.log(groups['Money Market']);
  //console.log(sumAccountTotal(groups['Money Market']))
  console.log(Object.values(groups).map(sumAccountTotal).map((n) => n / 100))
}
main();