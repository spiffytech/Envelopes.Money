import gql from "graphql-tag";
import groupBy from 'ramda/es/groupBy';
import * as shortid from "shortid";

import { fragments } from "../lib/apollo";
import {formatDate} from '../lib/utils';

/** @typedef {import('../types.d').Transaction} Transaction*/
/** @typedef {import('../types.d').TransactionWithAccounts} TransactionWithAccounts */
/** @typedef {import('../types.d').TransactionGroup} TransactionGroup */

export async function subscribe({ userId, wsclient }, onData) {
  return wsclient
    .subscribe({
      query: gql`
        ${fragments}
        subscription SubscribeTransactions($user_id: String!) {
          transactions(where: { user_id: { _eq: $user_id } }) {
            ...transaction
          }
        }
      `,
      variables: { user_id: userId }
    }, onData);
}

/**
 * @param {TransactionWithAccounts[]} transactions
 * @returns {TransactionGroup[]}
 */
export function group(transactions) {
  return Object.values(groupBy(txnId, transactions));
}

/**
 * @param {TransactionWithAccounts} transactionWithAccount
 * @returns {string} txn_id
 */
export function txnId(transactionWithAccount) {
  return transactionWithAccount.transaction.txn_id;
}

/**
 * @param {TransactionWithAccounts} transactionWithAccount
 * @returns {string} txn_id
 */
export function fromAccountId(transactionWithAccount) {
  return transactionWithAccount.from.id;
}

/**
 * @param {TransactionWithAccounts} transactionWithAccount
 * @returns {string} txn_id
 */
export function toAccountId(transactionWithAccount) {
  return transactionWithAccount.to.id;
}

/**
 * @param {TransactionWithAccounts} txn
 * @returns {string} date
 */
export function date(txn) {
  return txn.transaction.date;
}

/**
 * @param {TransactionWithAccounts} txn
 * @returns {string | null} label
 */
export function label(txn) {
  return txn.transaction.label;
}

/**
 * @returns {Pick<Transaction, 'id' | 'memo' | 'date' |'amount' | 'label' | 'cleared'>}
 */
export function mkEmptyTransaction() {
  return {
    id: `transaction/${shortid.generate()}`,
    memo: "",
    date: formatDate(new Date()),
    amount: 0,
    label: null,
    cleared: false
  };
}

/**
 * @param {string | null} account
 * @param {TransactionWithAccounts} transaction
 */
export function filterByAccount(account, transaction) {
  if (!account) return true;
  return (
    fromAccountId(transaction) === account ||
    toAccountId(transaction) === account
  );
}

/**
 * @param {TransactionWithAccounts} txn
 * @return {string}
 */
export function friendlyTypeName(txn) {
  switch (txn.transaction.type) {
    case 'banktxn':
      return 'Bank Transaction';
    case 'accountTransfer':
      return 'Account Transfer';
    case 'envelopeTransfer':
      return 'Envelope Transfer';
  }
}

/**
 * @param {TransactionWithAccounts} txn
 * @return {number}
 */
export function amount(txn) {
  return txn.transaction.amount;
}

/**
 * @param {TransactionWithAccounts} txn
 * @return {string | null}
 */
export function memo(txn) {
  return txn.transaction.memo;
}
