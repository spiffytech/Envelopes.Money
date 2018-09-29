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

import Amount from '../lib/Amount';
import {POJO as BucketAmountPOJO} from '../lib/BucketAmount';
import Category from '../lib/Category';
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
  const newRows: Array<GoodBudgetRow & {txfrId: string}> = [];
  const txfrs: {[key: string]: GoodBudgetRow[]} = {};
  gbRows.forEach((row: any) => {
    /* tslint:disable-next-line:curly */
    if (typeForRow(row) !== type_) return newRows.push(row);

    const key = `${row.Date}-${row.Amount.replace('-', '')}`;
    const arr = txfrs[key];
    txfrs[key] = [...(arr || []), row];
    return;
  });

  Object.entries(txfrs).forEach(([k, txfrRows]: [string, GoodBudgetRow[]]) => {
    if (txfrRows.length === 1) {  // An account transfer for setting up a new account has no corresponding Row
      const to = txfrRows[0];
      console.log('New account', k, txfrRows, (-amountOfStr(to!.Amount) / 100).toFixed(2));
      const fakeRow: GoodBudgetRow = {
        ...to!,
        Amount: (-amountOfStr(to!.Amount) / 100).toFixed(2),
        Account: '[Equity]',
      };
      txfrRows.push(fakeRow);
    }

    while (txfrRows.length > 0) {  // Covers multiple transfers in a single day
      const txfrId = shortid.generate();
      const from = txfrRows.find((row) => parseFloat(row.Amount) < 0);
      const to = txfrRows.find((row) => parseFloat(row.Amount) > 0);

      // Remove the items from the array
      txfrRows.splice(txfrRows.indexOf(from!), 1);
      txfrRows.splice(txfrRows.indexOf(to!), 1);

      newRows.push({
        ...from!,
        Name: to!.Account || to!.Envelope,
        Account: from!.Account || from!.Envelope,
        txfrId,
        // If we set Account it breaks detecting that this was an envelope transfer
        Notes: type_ === 'envelopeTransfer' ? 'Envelope Transfer' : from!.Notes,
      });
    }
  });

  return newRows;
}

function rowIsAccountTransfer(row: GoodBudgetRow) {
  return (
    row.Notes === 'Account Transfer' ||
    (row.Details === '' && row.Envelope === '') ||
    (row.Name === '' && row.Envelope === '[Unallocated]') ||  // Setting up a new bank account
    row.Account === '[Equity]'
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
  accountIds: {[key: string]: string},
  categoryIds: {[key: string]: string},
): Transaction<any> {
  const type = typeForRow(row);
  const toType = ({
    accountTransfer: 'account',
    envelopeTransfer: 'category',
    banktxn: 'category',
  } as {[key: string]: Types.BucketTypes})[type];

  const ids = {account: accountIds, category: categoryIds};

  const to: BucketAmountPOJO[] =
    type === 'banktxn' ?
    parseCategories(row).map((category) =>
      ({
        amount: -category.amount as number,
        bucketRef: {name: category.name, id: ids[toType][category.name], type: toType},
      }),
    ) :
    [{
      amount: -amountOfStr(row.Amount) as number,
      bucketRef: {name: row.Name, id: ids[toType][row.Name], type: toType},
    }];

  const fromType = type === 'envelopeTransfer' ? 'category' : 'account';

  const txn = TransactionFactory({
    _id: '',
    date: new Date(row.Date).toJSON(),
    amount: amountOfStr(row.Amount),
    memo: row.Notes,
    from: {
      name: row.Account,
      id: ids[fromType][row.Account],
      type: type === 'envelopeTransfer' ? 'category' : 'account',
    },
    to,
    payee: row.Name,
    type,
    extra: {},
  });

  if (txn.amount.pennies !== amountOfStr(row.Amount)) {
    console.log(JSON.stringify(row, null, 4));
    console.log(JSON.stringify(txn.toPOJO(), null, 4));
    throw new Error('Txn amonut didn\'t match row amount');
  }

  const errors = txn.errors();
  if (errors) console.log(JSON.stringify({errors, txn: txn.toPOJO(), row}, null, 4));

  return txn;
}

async function discoverCategories(rows: GoodBudgetRow[]) {
  const categoryNames: string[] = R.uniq(_.flatten(rows.map((row) => {
    const type = typeForRow(row);
    if (type === 'accountTransfer') return [];
    if (type === 'banktxn') return parseCategories(row).map((category) => category.name);
    if (type === 'envelopeTransfer') return [row.Account, row.Name];
    throw new Error('Invalid row type');
  })));

  const categories: Category[] = categoryNames.map((category) =>
    Category.POJO({
      name: category,
      target: 0 as Txns.Pennies,
      interval: 'weekly' as 'weekly',
      type: 'category' as 'category',
      _id: ['category', shortid.generate()].join('/'),
    }, Amount.Pennies(0)),
  );

  return {
    categories,
    categoryIds: R.fromPairs(categories.map((category) => [category.name, category.id] as [string, string])),
  };
}

async function discoverAccounts(rows: GoodBudgetRow[]) {
  const accountNames: string[] = R.uniq(_.flatten(rows.map((row) => {
    const type = typeForRow(row);
    if (type === 'accountTransfer') return [row.Name, row.Account];
    if (type === 'banktxn') return [row.Name];
    if (type === 'envelopeTransfer') return [];
    throw new Error('Invalid row type');
  })));

  const accounts: Txns.Account[] = accountNames.map((account) =>
    ({
      name: account,
      _id: ['account', shortid.generate()].join('/'),
      type: 'account' as 'account',
    }),
  );

  return {
    accounts,
    accountIds: R.fromPairs(accounts.map((account) => [account.name, account._id] as [string, string])),
  };
}

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file']);

  if (!process.env.COUCH_USER || !process.env.COUCH_PASS) throw new Error('Missing configuration');
  const remote = Couch.mkRemoteDB(process.env.COUCH_USER, process.env.COUCH_PASS);

  const rows = await readCsv(nconf.get('file'));

  const mergedAccountTxfrs =
    mergeAccountTransfers(rows.filter((row: any) => row.Account !== '[none]'), 'accountTransfer');
  const mergedEnvelopeTxfrs =
    mergeAccountTransfers(mergedAccountTxfrs.filter((row: any) => row.Account !== '[none]'), 'envelopeTransfer');

  mergedEnvelopeTxfrs.forEach((row) => {
    if (row.Envelope === '[Unallocated]' && row.Name === '') {
      console.log('Found', row);
    }
  });

  const {accounts, accountIds} = await discoverAccounts(mergedEnvelopeTxfrs);
  const {categories, categoryIds} = await discoverCategories(mergedEnvelopeTxfrs);
  console.log(accountIds, categoryIds);

  const txns: Array<Transaction<any>> =
  mergedEnvelopeTxfrs.
    filter((row) => row.Account !== '[none]').  // It's a fill
    map((row) => rowToTxn(row, accountIds, categoryIds));

  const txnErrors = txns.map((txn) => txn.errors()).filter((errors) => errors);
  if (txnErrors.length > 0) {
    console.log('Txns had errors');
    process.exit(1);
  }

  await Promise.all(categories.map((category) => Couch.upsertCategory(remote, category.toPOJO())));
  await Promise.all(accounts.map((account) => Couch.upsertAccount(remote, account)));

  if (!process.env.COUCH_USER || !process.env.COUCH_PASS) throw new Error('Missing configuration');
  try {
    const chunks = _.chunk(txns, 500);
    for (const chunk of chunks) {
      await Couch.bulkImport(remote, chunk);
    }
    // console.log(JSON.stringify(chunks[0], null, 4));
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
