import ApolloClient from 'apollo-client';
import gql from 'graphql-tag';
import * as shortid from 'shortid';

import mkApollo from '../lib/apollo';
import { fragments } from '../lib/apollo';
import { ITransaction } from './types';

export type T = ITransaction;

export function loadTransaction(
  { userId, apikey }: { userId: string; apikey: string },
  transactionId: string
) {
  const apollo = mkApollo(apikey);
  return apollo.query({
    query: gql`
      ${fragments}
      query GetTxns($user_id: String!, $txn_id: String!) {
        transactions(
          where: {
            _and: [{ user_id: { _eq: $user_id } }, { txn_id: { _eq: $txn_id } }]
          }
        ) {
          ...transaction
        }
      }
    `,
    variables: { user_id: userId, txn_id: transactionId }
  });
}

export function saveTransactions(
  { userId, apikey }: { userId: string; apikey: string },
  txns: ITransaction[]
) {
  const apollo = mkApollo(apikey);
  return apollo.mutate({
    mutation: gql`
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
            update_columns: [memo, date, amount, label, from_id, to_id]
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

export function deleteTransactions(
  { userId, apikey }: { userId: string; apikey: string },
  txnId: string
) {
  const apollo = mkApollo(apikey);
  return apollo.mutate({
    mutation: gql`
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

export async function subscribe(
  { userId, apollo }: { userId: string; apollo: ApolloClient<any> },
  onData: (data: { data: { transactions: ITransaction[] } }) => void
) {
  return apollo
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
    })
    .subscribe({ next: onData });
}

export function mkEmptyTransaction(userId: string) {
  return {
    id: shortid.generate(),
    user_id: userId,
    memo: '',
    date: new Date(),
    amount: 0,
    label: null,
    from_id: null,
    to_id: null
  };
}
