import gql from 'graphql-tag';

import {fragments} from '../apollo';

export default async function loadAccounts(wsclient, userId) {
  const {data: {accounts}} = await wsclient.query({
    query: gql`
      ${fragments}
      query GetAccounts($user_id: String!) {
        accounts(where: {user_id: {_eq: $user_id}}) {
          ...account
        }
      }
    `,
    variables: {user_id: userId},
  });

  return accounts;
}
