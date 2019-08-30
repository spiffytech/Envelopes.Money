import gql from 'graphql-tag';

import {fragments} from '../apollo';

export default function subscribe(wsclient, userId, onData) {
  return wsclient
    .subscribe({
      query: gql`
        ${fragments}
        subscription SubscribeAccounts($user_id: String!) {
          accounts(where: { user_id: { _eq: $user_id } }) {
            ...account
          }
        }
      `,
      variables: { user_id: userId }
    }, onData);
}
