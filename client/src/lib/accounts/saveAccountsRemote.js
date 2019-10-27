import gql from 'graphql-tag';

import {fragments} from '../apollo';

export default function saveAccounts(wsclient, accounts) {
  return wsclient.query({
    query: gql`
      ${fragments}
      mutation UpsertAccount($accounts: [accounts_insert_input!]!) {
        insert_accounts(
          objects: $accounts,
          on_conflict: {
            constraint: accounts_pkey, 
            update_columns: [name, type, extra, tags, _fingerprint]
          }) {
          returning {id}
        }
      }
    `,
    variables: {accounts},
  });
}
