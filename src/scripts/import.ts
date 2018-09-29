/* tslint:disable:no-var-requires */
import bluebird from 'bluebird';
import csv from 'csv-parse';
import * as _ from 'lodash';
import {fs} from 'mz';
import nconf from 'nconf';
import * as R from 'ramda';
import * as shortid from 'shortid';
import 'source-map-support/register';

// import {Category, discoverCategories} from '../lib/categories';
import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';

import {POJO as BucketAmountPOJO} from '../lib/BucketAmount';
import Transaction from '../lib/Transaction';
import TransactionFactory from '../lib/TransactionFactory';
import * as Types from '../lib/types';

global.Promise = bluebird;
(Promise as any).config({
  longStackTraces: true,
});

/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

require('dotenv').config();

nconf.argv().env();

function amountOfStr(str: string) {
  return parseInt(
    str.replace('.', '').replace(',', ''),
    10,
  ) as Txns.Pennies;
}

async function readCsv(file: string): Promise<GoodBudgetRow[]> {
  const contents = await fs.readFile(file);
  return new Promise<GoodBudgetRow[]>((resolve, reject) => {
    csv(contents.toString(), {columns: true, escape: '\\'}, (err: any, data: any) => {
      /* tslint:disable-next-line:curly */
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

export function parseCategories(row: GoodBudgetRow): Txns.EnvelopeEvent[] {
  /* tslint:disable-next-line:curly */
  if (row.Details === '') return [{
    name: row.Envelope,
    id: row.Envelope,
    amount: amountOfStr(row.Amount),
  }];

  return (
    row.Envelope ? [{name: row.Envelope, id: row.Envelope, amount: amountOfStr(row.Amount)}] :
    row.Details.split('||').
      map((detail: string) => detail.split('|')).
      map(([name, amount]): Txns.EnvelopeEvent => ({
        name,
        id: name,
        amount: amountOfStr(amount),
      }))
  );
}

/**
 * GoodBudget's export breaks account transfers into two transactions, so we'd
 * import double transfers (or transfers with no payees) if we imported as-is
 */
function mergeAccountTransfers(gbRows: any, type_: string): Array<GoodBudgetRow | GoodBudgetTxfr> {
  const newRows: GoodBudgetRow[] = [];
  const txfrs: {[key: string]: GoodBudgetRow[]} = {};
  gbRows.forEach((row: any) => {
    /* tslint:disable-next-line:curly */
    if (typeForRow(row) !== type_) return newRows.push(row);

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

      // Remove the items from the array
      txfrRows.splice(txfrRows.indexOf(from), 1);
      txfrRows.splice(txfrRows.indexOf(to), 1);

      newRows.push({...from, Name: to.Account || to.Envelope, Account: from.Account || from.Envelope, txfrId});
    }
  });

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
    throw new Error(`No categorzation for row: ${JSON.stringify(row)}`);
  }
}

export function rowToTxn(
  row: GoodBudgetRow,
): Transaction<any> {
  const type = typeForRow(row);
  const toType = ({
    accountTransfer: 'account',
    envelopeTransfer: 'category',
    banktxn: 'category',
  } as {[key: string]: Types.BucketTypes})[type];

  const to: BucketAmountPOJO[] =
    type === 'banktxn' ?
    parseCategories(row).map((category) =>
      ({amount: category.amount as number, bucketRef: {name: category.name, id: category.id, type: toType}}),
    ) :
    [{amount: amountOfStr(row.Amount) as number, bucketRef: {name: row.Name, id: '', type: toType}}];

  return TransactionFactory({
    _id: '',
    date: new Date(row.Date).toJSON(),
    amount: amountOfStr(row.Amount),
    memo: row.Notes,
    from: {name: row.Account, id: '', type: type === 'envelopeTransfer' ? 'category' : 'account'},
    to,
    payee: row.Name,
    type,
    extra: {},
  });
}

async function discoverCategories(db: PouchDB.Database, txns: Txns.Txn[]) {
  const categorieNames =
    R.uniq(
      R.flatten<Txns.TxnItem>(
        txns.filter(Txns.hasCategories).
        map(Txns.categoriesForTxn),
      ).
      map(({account}) => account),
    );

  const categories: Txns.Category[] = categorieNames.map((category) =>
    ({name: category,
      target: 0 as Txns.Pennies,
      interval: 'weekly' as 'weekly',
      type: 'category' as 'category',
      _id: ['category', shortid.generate()].join('/'),
    }),
  );

  await Promise.all(categories.map((category) => Couch.upsertCategory(db, category)));
  return R.fromPairs(categories.map((category) => [category.name, category._id] as [string, string]));
}

async function discoverAccounts(db: PouchDB.Database, txns: Txns.Txn[]) {
  const accountNames = R.uniq(
    Txns.journalToLedger(txns).
    map((item: Txns.TxnItem) => item.account),
  );

  const accounts: Txns.Account[] = accountNames.map((account) =>
    ({
      name: account,
      _id: ['account', shortid.generate()].join('/'),
      type: 'account' as 'account',
    }),
  );

  await Promise.all(accounts.map((account) => Couch.upsertAccount(db, account)));
  return R.fromPairs(accounts.map((account) => [account.name, account._id] as [string, string]));
}

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file']);

  const rows = await readCsv(nconf.get('file'));
  const mergedAccountTxfrs =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]'), 'accountTransfer');
  const txns: Array<Transaction<any>> =
    mergeAccountTransfers(mergedAccountTxfrs.filter((row: any) => row.Account !== '[none]'), 'envelopeTransfer').
    filter((row) => row.Account !== '[none]').  // It's a fill
    map((row) => rowToTxn(row));

  if (!process.env.COUCH_USER || !process.env.COUCH_PASS) throw new Error('Missing configuration');
  const remote = Couch.mkRemoteDB(process.env.COUCH_USER, process.env.COUCH_PASS);
  try {
    /*
    const accountIds = await discoverAccounts(remote, txns);
    const categoryIds = await discoverCategories(remote, txns);
    */

    const chunks = _.chunk(txns.map((txn) => txn.toPOJO()), 500);
    for (const chunk of chunks) {
      // await Couch.bulkImport(remote, chunk);
    }
    console.log(JSON.stringify(chunks[0], null, 4));
  } catch (ex) {
    console.log('error');
    console.error(ex);
    console.error(JSON.stringify(ex));
  }
}
if (nconf.get('run')) {
  /* tslint:disable-next-line:no-floating-promises */
  main();
}
