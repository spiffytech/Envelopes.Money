import gql from "graphql-tag";
import * as shortid from "shortid";

import { fragments } from "../lib/apollo";
import {formatDate} from '../lib/utils';

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
