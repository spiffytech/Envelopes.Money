import gql from "graphql-tag";
import groupBy from 'ramda/es/groupBy';
import * as shortid from "shortid";

import { fragments } from "../lib/apollo";
import {formatDate} from '../lib/utils';

/** @typedef {import('../types.d').Transaction} Transaction*/
/** @typedef {import('../types.d').TransactionWithAccounts} TransactionWithAccount */
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
 * @param {TransactionWithAccount[]} transactions
 * @returns {TransactionGroup[]}
 */
export function group(transactions) {
  return Object.values(groupBy((txn) => txn.transaction.txn_id, transactions));
}

/**
 * @returns {Partial<Transaction>}
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
