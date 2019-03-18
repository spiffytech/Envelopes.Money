import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {ITransaction} from '../../../common/lib/types';

export type T = ITransaction;

export function loadTransaction(userId: string, apiKey: string, transactionId: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{transactions: ITransaction[]}>({
    query: gql`
      ${fragments}
      query GetTxns($user_id: String!, $txn_id: String!) {
        transactions(where: {_and: [{user_id: {_eq: $user_id}}, {txn_id: {_eq: $txn_id}}]}) {
          ...transaction
        }
      }
    `,
    variables: {user_id: userId, txn_id: transactionId},
  });
}

export function saveTransactions(userId: string, apiKey: string, txns: ITransaction[]) {
  const apollo = mkApollo(apiKey);
  return apollo.mutate({
    mutation: gql`
      ${fragments}
      mutation UpsertTransactions($txns: [transactions_insert_input!]!) {
        insert_transactions(
          objects: $txns,
          on_conflict: {
            constraint: transactions_pkey, 
            update_columns: [memo, date, amount, label, from_id, to_id]
          }) {
          returning {id}
        }
      }
    `,
    variables: {txns},
  });
}

export function deleteTransactions(userId: string, apiKey: string, txnId: string) {
  const apollo = mkApollo(apiKey);
  return apollo.mutate({
    mutation: gql`
      ${fragments}
      mutation DeleteTransactions($txnId: String!) {
        delete_transactions(where: {txn_id: {_eq: $txnId}}) {
          returning {id}
        }
      }
    `,
    variables: {txnId},
  });
}
