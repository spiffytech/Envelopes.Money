import gql from "graphql-tag";

import { fragments } from "../apollo";

export default function subscribe(wsclient, userId, onData) {
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
