import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {TxnGrouped} from '../../../common/lib/types';

export type T = TxnGrouped;

export function loadTransactions(userId: string, apiKey: string, searchTerm: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{txns_grouped: T[]}>({
    query: gql`
      ${fragments}
      query GetTxnsGrouped($user_id: String!, $searchTerm: String!) {
        txns_grouped(where: {_and: [
          {user_id: {_eq: $user_id}},
          {_or: [
            {label: {_ilike: $searchTerm}},
            {memo: {_ilike: $searchTerm}},
            {from_name: {_ilike: $searchTerm}},
            {to_names: {_ilike: $searchTerm}}
          ]}
        ]}) {
          ...txn_grouped
        }
      }
    `,
    variables: {user_id: userId, searchTerm: `%${searchTerm}%`},
  });
}
