import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {Balance, ITransaction} from '../../../common/lib/types';

export function loadTransaction(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{balances: Balance[]}>({
    query: gql`
      ${fragments}
      query GetBalances($user_id: String!) {
        balances(where: {user_id: {_eq: $user_id}}) {
          ...balance
        }
      }
    `,
    variables: {user_id: userId},
  });
}
