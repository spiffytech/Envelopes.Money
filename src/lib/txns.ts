import * as dateFns from 'date-fns';
import * as _ from 'lodash';
import * as R from 'ramda';

import {DETxn, TxnItem} from './types';
export {DETxn, TxnItem} from './types';

export interface LedgerEvent {
  _id: string;
  date: string;
  amount: number;
  memo: string;
}

export interface EnvelopeTransfer extends LedgerEvent {
  from: string;
  to: string;
  type: 'envelopeTransfer';
}

export interface BankTxn extends LedgerEvent {
  account: string;
  payee: string;
  categories: {[key: string]: number};
  type: 'banktxn';
}

export interface AccountTransfer extends LedgerEvent {
  from: string;
  to: string;
  txfrId: string;
  type: 'accountTransfer';
}

export type Txn = BankTxn | AccountTransfer | EnvelopeTransfer;

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
  return {account, amount: txn.items[account]};
}

export function journalToLedger(txns: Txn[]): TxnItem[] {
  return _.flatten(txns.filter(touchesBank).map(accountsForTxn));
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

export function accountsForTxn(txn: BankTxn | AccountTransfer): Array<{account: string, amount: number}> {
  if (txn.type === 'banktxn') return [{account: txn.account, amount: txn.amount}];

  return [
    {account: txn.from, amount: txn.amount},
    {account: txn.to, amount: -txn.amount},
  ];
}

export function categoriesForTxn(txn: BankTxn | EnvelopeTransfer): TxnItem[] {
  if (isBankTxn(txn)) {
    return (
      Object.entries(txn.categories).
      map(([category, amount]): TxnItem =>
        ({account: category, amount})
      )
    )
  } else if (isEnvelopeTxfr(txn)) {
    return [
      {account: txn.from, amount: txn.amount},
      {account: txn.to, amount: -txn.amount},
    ];
  }
  const n: never = txn;
  return n;
}

export function isBankTxn(txn: Txn): txn is BankTxn {
  return txn.type === 'banktxn';
}

export function isAccountTxfr(txn: Txn): txn is AccountTransfer {
  return txn.type === 'accountTransfer';
}

export function isEnvelopeTxfr(txn: Txn): txn is EnvelopeTransfer {
  return txn.type === 'envelopeTransfer';
}

export function touchesBank(txn: Txn): txn is BankTxn | AccountTransfer {
  switch (txn.type) {
    case 'banktxn': return true;
    case 'accountTransfer': return true;
    case 'envelopeTransfer': return false;
    default:
      const n: never = txn;
      return n;
  }
}

export function hasCategories(txn: Txn): txn is BankTxn | EnvelopeTransfer {
  switch (txn.type) {
    case 'banktxn': return true;
    case 'envelopeTransfer': return true;
    case 'accountTransfer': return false;
    default:
      const n: never = txn;
      return n;
  }
}

export const touchesAccount = R.curry((account: string, txn: Txn): boolean => {
  if (isEnvelopeTxfr(txn)) return false;
  if(isBankTxn(txn)) return txn.account === account;
  return txn.from === account || txn.to === account;
});

export function formatDate(date: string) {
  return dateFns.format(date, 'YYYY-MM-DD')
}

export function penniesToDollars(pennies: number) {
  return pennies / 100;
}

export function dollarsToPennies(dollars: number) {
  return Math.round(dollars * 100);
}