import gql from "graphql-tag";

import { fragments } from "../apollo";

export default function deleteTransactions(wsclient, txnIds) {
  return wsclient.query({
    query: gql`
      ${fragments}
      mutation DeleteTransactions($txnIds: [String!]!) {
        delete_transactions(where: { id: { _in: $txnIds } }) {
          returning {
            id
          }
        }
      }
    `,
    variables: { txnIds }
  });
}
