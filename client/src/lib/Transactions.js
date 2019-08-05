import gql from "graphql-tag";
import * as shortid from "shortid";

import { fragments } from "../lib/apollo";
import {formatDate} from '../lib/utils';

export function saveTransactions({wsclient}, txns) {
  return wsclient.query({
    query: gql`
      ${fragments}
      mutation UpsertTransactions(
        $txnId: String!
        $txns: [transactions_insert_input!]!
      ) {
        delete_transactions(where: { txn_id: { _eq: $txnId } }) {
          returning {
            id
          }
        }

        insert_transactions(
          objects: $txns
          on_conflict: {
            constraint: transactions_pkey
            update_columns: [memo, date, amount, label, from_id, to_id, cleared]
          }
        ) {
          returning {
            id
          }
        }
      }
    `,
    variables: { txns, txnId: txns[0].txn_id }
  });
}

export function deleteTransactions({wsclient}, txnId) {
  return wsclient.query({
    query: gql`
      ${fragments}
      mutation DeleteTransactions($txnId: String!) {
        delete_transactions(where: { txn_id: { _eq: $txnId } }) {
          returning {
            id
          }
        }
      }
    `,
    variables: { txnId }
  });
}

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

export function mkEmptyTransaction() {
  return {
    id: `transaction/${shortid.generate()}`,
    memo: "",
    date: formatDate(new Date()),
    amount: 0,
    label: null,
    from_id: null,
    to_id: null,
    cleared: false
  };
}
