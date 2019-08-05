import gql from "graphql-tag";

import { fragments } from "../apollo";

export default function saveTransactions(wsclient, txns) {
  return wsclient.query({
    query: gql`
      ${fragments}
      mutation UpsertTransactions(
        $txns: [transactions_insert_input!]!
      ) {
        insert_transactions(
          objects: $txns
          on_conflict: {
            constraint: transactions_pkey
            update_columns: [memo, date, amount, label, from_id, to_id, cleared, sha256]
          }
        ) {
          returning {
            id
          }
        }
      }
    `,
    variables: { txns }
  });
}
