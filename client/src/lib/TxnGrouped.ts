import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {TxnGrouped} from '../../../common/lib/types';

export type T = TxnGrouped;

export function loadTransactions(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{txns_grouped: T[]}>({
    query: gql`
      ${fragments}
      query GetTxnsGrouped($user_id: String!) {
        txns_grouped(where: {user_id: {_eq: $user_id}}) {
          ...txn_grouped
        }
      }
    `,
    variables: {user_id: userId},
  });
}
