import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export function loadTransactions({userId, apikey}, searchTerm) {
  const apollo = mkApollo(apikey);
  return apollo.query({
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

export async function subscribe({userId, apollo}, onData) {
  return apollo.subscribe({
    query: gql`
      ${fragments}
      subscription SubscribeTxnsGrouped($user_id: String!) {
        txns_grouped(where: 
          {user_id: {_eq: $user_id}}
        ) {
          ...txn_grouped
        }
      }
    `,
    variables: {user_id: userId},
  }).subscribe({next: onData});
}
