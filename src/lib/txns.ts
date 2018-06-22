import _ from 'lodash';
import * as R from 'ramda';

export interface TxnItem {
  account: string;
  amount: number;
}

export interface DETxn {
  id: string;
  payee: string;
  date: Date;
  items: {[key: string]: number};
  memo: string;
}

export interface LedgerEvent {
  id: string;
  date: Date;
  payee: string;
  account: string;
  amount: number;
  memo: string;
}

export interface EnvelopeTransfer {
  date: Date;
  amount: number;
  memo: string;
  categories: {[key: string]: number};
  type: 'envelopeTransfer';
}

export interface Txn extends LedgerEvent {
  categories: {[key: string]: number};
  type: 'transaction';
}

export interface AccountTransfer extends LedgerEvent {
  txfrId: string;
  type: 'accountTransfer';
}

export function sumAccountTotal(account: string, txns: DETxn[]) {
  return txns.
  filter((txn) => txn.items[account]).
  reduce((total, txn) => total + txn.items[account], 0);
}

export function learnAccountsFromTxns(txns: DETxn[]): string[] {
  return _.flatten(
    _.uniq(_.flatten(txns.map((txn) => Object.keys(txn.items)))).
    map((account) => {
      const splits = account.split(':');
      const ret = [];
      for (let i = 1; i <= splits.length; i++) {
        ret.push(account.split(':', i).join(':'));
      }
      return ret;
    })
  );
}

function txnItemOfTxn(txn: DETxn, account: string): TxnItem {
  return {account: account, amount: txn.items[account]};
}

export function journalToLedger(txns: DETxn[]): TxnItem[] {
  return _.flatten(
    txns.map((txn) => Object.keys(txn.items).map((account) => txnItemOfTxn(txn, account)))
  );
}

/**
 * A reducer factory for grouping Txns into TxnItems grouped by account they
 * affect, including all nested account levels
 */
export function groupByAccount(acc: {[key: string]: TxnItem[]}, txn: DETxn): {[key: string]: TxnItem[]} {
  Object.keys(txn.items).
  forEach((account) =>
    acc[account] = [...acc[account] || [], txnItemOfTxn(txn, account)]
  );

  return acc;
}

export function calcBalances(txns: DETxn[], filterFn: (txnItem: TxnItem) => boolean) {
  const txnItems: TxnItem[] = journalToLedger(txns);
  const groups = R.groupBy((txnItem) => txnItem.account, txnItems.filter(filterFn));
  return Object.entries(groups).map(([account, txnItems]) => ({
    account: account,
    balance: txnItems.map(R.prop('amount')).reduce(R.add, 0),
  }));
}