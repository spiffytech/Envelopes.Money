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
import {TxnItem} from '../lib/txns';
import * as Txns from '../lib/txns';
import {GoodBudgetRow, GoodBudgetTxfr} from './types';

global.Promise = bluebird;
(Promise as any).config({
  longStackTraces: true,
});

/* tslint:disable:no-var-requires */
/* tslint:disable:no-console */
/* tslint:disable:object-literal-sort-keys */

require('dotenv').config();
console.log('host', process.env.COUCH_HOST);

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

export function parseCategories(row: GoodBudgetRow): {[key: string]: Txns.Pennies} {
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
  row: GoodBudgetRow,
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
  row: GoodBudgetRow,
): TxnItem[] {
  if (isIncome(IncomePayees, row.Name)) {
    return [
      {account: 'Income:Salary', amount: -amountOfStr(row.Amount) as Txns.Pennies},
      {
        account: nameAccount(AssetAccounts, LiabilityAccounts, row),
        amount: amountOfStr(row.Amount),
      },
    ];
  }

  return [{account: nameAccount(AssetAccounts, LiabilityAccounts, row), amount: amountOfStr(row.Amount)}];
}

export function mkCategoryItems(
  [category, amount, name]: [string, Txns.Pennies, string],
  isFill: boolean,
  AssetAccounts: string[],
  LiabilityAccounts: string[],
): TxnItem[] {
  /* tslint:disable-next-line:curly */
  if (isFill) {
    return [
      {account: `Liabilities:${category}`, amount: -amount as Txns.Pennies},
      {account: `Expenses:${category}`, amount},
    ];
  }

  /* tslint:disable-next-line:curly */
  if (category === '') return [{
    account: nameAccount(AssetAccounts, LiabilityAccounts, name),
    amount: -amount as Txns.Pennies,
  }];  // Probably an account transfer

  return [{account: `Liabilities:${category}`, amount: -amount as Txns.Pennies}];
}

export function rowToBankTxn(row: GoodBudgetRow): Txns.BankTxn {
  return {
    _id: shortid.generate(),
    date: new Date(row.Date).toString(),
    amount: amountOfStr(row.Amount),
    account: row.Account,
    payee: row.Name,
    memo: row.Notes,
    categories: parseCategories(row),
    type: 'banktxn',
  };
}

export function rowToAccountTxfr(row: GoodBudgetTxfr): Txns.AccountTransfer {
  return {
    _id: shortid.generate(),
    date: new Date(row.Date).toString(),
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
  row: GoodBudgetRow,
): Txns.Txn {
  const type = typeForRow(row);

  if (type === 'accountTransfer') return rowToAccountTxfr(row as GoodBudgetTxfr);
  if (type === 'envelopeTransfer') return rowToEnvelopeTransfer(row);
  if (type === 'banktxn') return rowToBankTxn(row);
  throw new Error('Did not find type for row');
}

function nullFilter<T>(item: T | null | undefined): item is T {
  return Boolean(item);
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

  console.log(categorieNames);
  const categories: Txns.Category[] = categorieNames.map((category) =>
    ({name: category,
      target: 0 as Txns.Pennies,
      interval: 'weekly' as 'weekly',
      type: 'category' as 'category',
      _id: shortid.generate(),
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
      _id: shortid.generate(),
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
    txnItems.filter(({account}) => account === 'SECU Checking').
      map(({amount}) => amount).reduce((acc, i) => acc + i, 0) / 100,
    txnItems.filter(({account}) => account === 'AmEx').
      map(({amount}) => amount).reduce((acc, i) => acc + i, 0) / 100,
  );

  if (!process.env.COUCH_USER || !process.env.COUCH_PASS) throw new Error('Missing configuration');
  const remote = await Couch.mkRemoteDB(process.env.COUCH_USER, process.env.COUCH_PASS);
  try {
    console.log(remote === null);
    const accountIds = await discoverAccounts(remote, txns);
    const categoryIds = await discoverCategories(remote, txns);
    const txns_: Txns.Txn[] = txns.map((txn) => {
      if (Txns.isBankTxn(txn)) {
        const categories = R.fromPairs(Object.entries(txn.categories).map(
          ([category, balance]) => [categoryIds[category], balance] as [string, Txns.Pennies]),
        );
        return {
          ...txn,
          account: accountIds[txn.account],
          categories,
        };
      } else if (Txns.isAccountTxfr(txn)) {
        return {
          ...txn,
          from: accountIds[txn.from],
          to: accountIds[txn.to],
        };
      } else if (Txns.isEnvelopeTxfr(txn)) {
        return {
          ...txn,
          from: categoryIds[txn.from],
          to: categoryIds[txn.to],
        };
      }
      const t: never = txn;
      return t;
    });

    const chunks = _.chunk(txns_, 500);
    for (const chunk of chunks) {
      await Couch.bulkImport(remote, chunk);
    }
  } catch (ex) {
    console.log('error');
    console.error(ex);
    console.error(JSON.stringify(ex));
  }
}
if (nconf.get('run')) {
  main();
}
