/* tslint:disable:no-var-requires */
import csv from 'csv-parse';
import gql from 'graphql-tag';
import * as _ from 'lodash';
import {fs} from 'mz';
import nconf from 'nconf';
import * as shortid from 'shortid';
import 'source-map-support/register';

import mkApollo from '../lib/apollo';

import * as TransactionParts from '../lib/TransactionParts';

import * as CommonTypes from '../../../common/lib/types';

export interface IGoodBudgetRow {
  Date: string;
  Envelope: string;
  Account: string;
  Name: string;
  Amount: string;
  Notes: string;
  Status: string;
  Details: string;
}

export interface IGoodBudgetTxfr extends IGoodBudgetRow {
  txfrId: string;
}

if (process.env.NODE_ENV !== 'production'){
  require('longjohn');
}

/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

require('dotenv').config();
nconf.argv().env();

const token = process.env.HASURA_ADMIN_KEY;
const userId = process.env.IMPORT_USER!;
if (!token) throw new Error('Missing access token');
if (!userId) throw new Error('Missing Apollo user');
console.log(token)
const apollo = mkApollo(token, true)

function amountOfStr(str: string) {
  return parseInt(
    str.replace('.', '').replace(',', ''),
    10,
  );
}

async function readCsv(file: string): Promise<IGoodBudgetRow[]> {
  const contents = await fs.readFile(file);
  return new Promise<IGoodBudgetRow[]>((resolve, reject) => {
    csv(contents.toString(), {columns: true, escape: '\\'}, (err: any, data: any) => {
      /* tslint:disable-next-line:curly */
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

export interface IEnvelopeEvent {
  name: string;
  id: string;
  amount: number;
}

export function parseCategories(row: IGoodBudgetRow): IEnvelopeEvent[] {
  /* tslint:disable-next-line:curly */
  if (row.Details === '') return [{
    name: row.Envelope,
    id: row.Envelope,
    amount: amountOfStr(row.Amount),
  }];

  return (
    row.Envelope ? [
      {name: row.Envelope, id: row.Envelope, amount: amountOfStr(row.Amount)}
    ] :
    row.Details.split('||').
      map((detail: string) => detail.split('|')).
      map(([name, amount]): IEnvelopeEvent => ({
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
function mergeAccountTransfers(gbRows: any, type_: string): Array<IGoodBudgetRow | IGoodBudgetTxfr> {
  const newRows: Array<IGoodBudgetRow & {txfrId: string}> = [];
  const txfrs: {[key: string]: IGoodBudgetRow[]} = {};
  gbRows.forEach((row: any) => {
    /* tslint:disable-next-line:curly */
    if (typeForRow(row) !== type_) return newRows.push(row);

    const key = `${row.Date}-${row.Amount.replace('-', '')}`;
    const arr = txfrs[key];
    txfrs[key] = [...(arr || []), row];
    return;
  });

  Object.entries(txfrs).forEach(([k, txfrRows]: [string, IGoodBudgetRow[]]) => {
    if (txfrRows.length === 1) {  // An account transfer for setting up a new account has no corresponding Row
      const to = txfrRows[0];
      console.log('New account', k, txfrRows, (-amountOfStr(to!.Amount) / 100).toFixed(2));
      const fakeRow: IGoodBudgetRow = {
        ...to!,
        Amount: (-amountOfStr(to!.Amount) / 100).toFixed(2),
        Name: '[Equity]',
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

function rowIsAccountTransfer(row: IGoodBudgetRow) {
  return (
    row.Notes === 'Account Transfer' ||
    (row.Details === '' && row.Envelope === '')
  );
}

export function typeForRow(row: IGoodBudgetRow) {
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
  row: IGoodBudgetRow,
  accounts: {[key: string]: CommonTypes.IAccount},
  categories: {[key: string]: CommonTypes.IAccount},
): CommonTypes.ITransaction[] {
  const type = typeForRow(row);

  const ids = {account: accounts, category: categories};
  const toType = ({
    accountTransfer: 'account',
    envelopeTransfer: 'category',
    banktxn: 'category',
  } as {[key: string]: 'account' | 'category'})[type];

  const txnId = shortid.generate();
  const transactionsPartial: Pick<CommonTypes.ITransaction, 'user_id' | 'memo' | 'date' | 'label' | 'type' | 'txn_id'> =
    {
      user_id: userId!,
      memo: row.Notes,
      date: new Date(row.Date),
      label: type === 'banktxn' ? (row.Name || '[Equity]') : null,
      type,
      txn_id: txnId,
    };

  const parts: CommonTypes.ITransaction[] =
    type === 'banktxn' ?
    _.flatten(parseCategories(row).map((category): CommonTypes.ITransaction[] => [
      {
        ...transactionsPartial,
        id: shortid.generate(),
        amount: -category.amount,
        from_id: accounts[row.Account].id,
        to_id: ids[toType][category.name].id,
      },
    ])) :
    [
      {
        ...transactionsPartial,
        id: shortid.generate(),
        amount: -amountOfStr(row.Amount),
        to_id: ids[toType][row.Name].id,
        from_id: (type === 'envelopeTransfer' ? categories[row.Account] : accounts[row.Account]).id,
      },
    ];

  return parts;
}

function discoverCategories(rows: IGoodBudgetRow[]): {[key: string]: CommonTypes.IAccount} {
  const categoryNames: string[] = _.uniq(_.flatten(rows.map((row) => {
    const type = typeForRow(row);
    if (type === 'accountTransfer') return [];
    if (type === 'banktxn') return parseCategories(row).map((category) => category.name);
    if (type === 'envelopeTransfer') return [row.Account, row.Name];
    throw new Error('Invalid row type');
  })));

  const categories: CommonTypes.IAccount[] = categoryNames.map((category) =>
    ({
      id: ['category', shortid.generate()].join('/'),
      user_id: userId,
      name: category,
      type: 'envelope' as 'envelope',
      extra: {
        target: 0,
        interval: 'total' as 'total',
        due: null,
      },
    }),
  );

  return _.fromPairs(categories.map((category) => [category.name, category]));
}

function discoverAccounts(rows: IGoodBudgetRow[]): {[key: string]: CommonTypes.IAccount} {
  const accountNames: string[] = _.uniq(_.flatten(rows.map((row) => {
    const type = typeForRow(row);
    if (type === 'accountTransfer') return [row.Name, row.Account];
    if (type === 'banktxn') return [row.Account];
    if (type === 'envelopeTransfer') return [];
    throw new Error('Invalid row type');
  })));

  const accounts: CommonTypes.IAccount[] = accountNames.map((account) =>
    ({
      id: ['account', shortid.generate()].join('/'),
      user_id: userId,
      name: account,
      type: 'account' as 'account',
      extra: {},
    })
  );

  return _.fromPairs(accounts.map((account) => [account.name, account]));
}

async function main() {
  // Putting this here so the unit tests don't require these values
  nconf.required(['file']);

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

  const accounts = discoverAccounts(mergedEnvelopeTxfrs);
  const categories = discoverCategories(mergedEnvelopeTxfrs);

  const buckets = [...Object.values(accounts), ...Object.values(categories)];

  const transactions: CommonTypes.ITransaction[] =
  _.flatten(mergedEnvelopeTxfrs.
    filter((row) => row.Account !== '[none]').  // It's a fill
    map((row) => rowToTxn(row, accounts, categories)));

  /*
  console.log(JSON.stringify(transactions, null, 4));
  return;
  */

  await apollo.mutate({
    mutation: gql`
      mutation InsertAccounts($objects: [accounts_insert_input!]!) {
        insert_accounts(objects: $objects) {returning {id}}
      }
    `,
    variables: {
      objects: buckets,
    },
  });

  await apollo.mutate({
    mutation: gql`
      mutation InsertTransactions($objects: [transactions_insert_input!]!) {
        insert_transactions(objects: $objects) {returning {id}}
      }
    `,
    variables: {
      objects: transactions,
    },
  });
}
if (nconf.get('run')) {
  /* tslint:disable-next-line:no-floating-promises */
  main();
}
