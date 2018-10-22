/* tslint:disable:no-var-requires */
import * as csv from 'csv-parse';
import gql from 'graphql-tag';
import * as _ from 'lodash';
import {fs} from 'mz';
import * as nconf from 'nconf';
import * as R from 'ramda';
import * as shortid from 'shortid';
import 'source-map-support/register';

import {IGoodBudgetRow, IGoodBudgetTxfr} from './types';

import mkApollo from '../lib/apollo';

import Account , {IAccountPOJO} from '../lib/Account';
import Amount from '../lib/Amount';
import Category, {ICategoryPOJO} from '../lib/Category';
import Transaction from '../lib/Transaction';
import TransactionFactory from '../lib/TransactionFactory';
import TransactionGraphQLTranslator from '../lib/TransactionGraphQLTranslator';
import * as Types from '../lib/types';

if (process.env.NODE_ENV !== 'production'){
  require('longjohn');
}

/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

require('dotenv').config();
nconf.argv().env();

const token = process.env.IMPORT_ACCESS_TOKEN
const userId = process.env.IMPORT_USER!
if (!token) throw new Error('Missing access token');
if (!userId) throw new Error('Missing Apollo user');
console.log(token)
const apollo = mkApollo(token)

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
    row.Envelope ? [{name: row.Envelope, id: row.Envelope, amount: amountOfStr(row.Amount)}] :
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
  accounts: {[key: string]: Account},
  categories: {[key: string]: Category},
): Transaction {
  const type = typeForRow(row);
  const toType = ({
    accountTransfer: 'account',
    envelopeTransfer: 'category',
    banktxn: 'category',
  } as {[key: string]: Types.BucketTypes})[type];

  const ids = {account: accounts, category: categories};

  const to: Array<{amount: Amount, bucket: Category | Account}> =
    type === 'banktxn' ?
    parseCategories(row).map((category) =>
      ({
        amount: Amount.Pennies(-category.amount as number),
        bucket: ids[toType][category.name],
      }),
    ) :
    [{
      amount: Amount.Pennies(-amountOfStr(row.Amount) as number),
      bucket: ids[toType][row.Name],
    }];

  const from =
    type === 'envelopeTransfer' ?
    categories[row.Account] :
    accounts[row.Account]

  const txn = TransactionFactory(
    {
      id: '',
      date: new Date(row.Date),
      payee: type === 'banktxn' ? (row.Name || '[Equity]') : null,
      memo: row.Notes,
      from,
      to,
      userId: userId!,
    },
    type,
  );

  if (txn.amount.pennies !== amountOfStr(row.Amount)) {
    console.log(JSON.stringify(row, null, 4));
    console.log(JSON.stringify(txn, null, 4));
    throw new Error('Txn amonut didn\'t match row amount');
  }

  const errors = txn.errors();
  if (errors) console.log(JSON.stringify({errors, txn, row}, null, 4));

  return txn;
}

async function discoverCategories(rows: IGoodBudgetRow[]) {
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
      target: 0,
      interval: 'weekly' as 'weekly',
      id: ['category', shortid.generate()].join('/'),
      user_id: userId,
    }),
  );

  return {
    categories,
    categoryIds: R.fromPairs(categories.map((category) => [category.name, category] as [string, Category])),
  };
}

async function discoverAccounts(rows: IGoodBudgetRow[]) {
  const accountNames: string[] = R.uniq(_.flatten(rows.map((row) => {
    const type = typeForRow(row);
    if (type === 'accountTransfer') return [row.Name, row.Account];
    if (type === 'banktxn') return [row.Account];
    if (type === 'envelopeTransfer') return [];
    throw new Error('Invalid row type');
  })));

  const accounts: Account[] = accountNames.map((account) =>
    new Account({
      name: account,
      id: ['account', shortid.generate()].join('/'),
      user_id: userId,
    })
  );

  return {
    accounts,
    accountIds: R.fromPairs(accounts.map((account) => [account.name, account] as [string, Account])),
  };
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

  const {accounts, accountIds} = await discoverAccounts(mergedEnvelopeTxfrs);
  const {categories, categoryIds} = await discoverCategories(mergedEnvelopeTxfrs);
  console.log('accounts', accountIds);
  console.log('categories', categoryIds);

  const txns: Transaction[] =
  mergedEnvelopeTxfrs.
    filter((row) => row.Account !== '[none]').  // It's a fill
    map((row) => rowToTxn(row, accountIds, categoryIds));

  const txnErrors = txns.map((txn) => txn.errors()).filter((errors) => errors);
  if (txnErrors.length > 0) {
    console.log('Txns had errors');
    process.exit(1);
  }

  await apollo.mutate({
    mutation: gql`
      mutation insertCategory($objects: [category_insert_input!]!) {
        insert_category(objects: $objects
        ) { affected_rows }
      }
    `,
    variables: {
      objects: categories.map((category) => {
        const ret: ICategoryPOJO = {
          id: category.id,
          name: category.name,
          interval: category.interval,
          due: category.due ? category.due.toJSON() : undefined,
          target: category.target.pennies,
          user_id: userId,
        }
        return ret;
      }),
    },
  });

  await apollo.mutate({
    mutation: gql`
      mutation insertAccount($objects: [account_insert_input!]!) {
        insert_account(objects: $objects) { affected_rows }
      }
    `,
    variables: {
      objects: accounts.map((account) => {
        const ret: IAccountPOJO = {
          id: account.id,
          name: account.name,
          user_id: userId,
        };
        return ret;
      }),
    },
  });

  console.log(JSON.stringify(txns.map((txn) => TransactionGraphQLTranslator.toGraphQL(txn)), null, 4));
  await apollo.mutate({
    mutation: gql`
      mutation insert($objects: [transaction_insert_input!]!) {
        insert_transaction(objects: $objects) { affected_rows }
      }
    `,
    variables: {
      objects: txns.map((txn) => TransactionGraphQLTranslator.toGraphQL(txn)),
    },
  });
}
if (nconf.get('run')) {
  /* tslint:disable-next-line:no-floating-promises */
  main();
}
