import gql from 'graphql-tag';

import mkApollo from './apollo';
import {fragments} from './apollo';
import {IAccount, BankAccount, Envelope} from './types';

export type T = IAccount;
export type Envelope = Envelope;
export type BankAccount = BankAccount;

export function isEnvelope(account: T): account is Envelope {
  return account.type === 'envelope';
}

export function loadAccounts(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{accounts: T[]}>({
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
}

export function loadAccount(userId: string, apiKey: string, accountId: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{accounts: T[]}>({
    query: gql`
      ${fragments}
      query GetAccounts($user_id: String!, $account_id: String!) {
        accounts(where: {_and: [{user_id: {_eq: $user_id}}, {id: {_eq: $account_id}}]}) {
          ...account
        }
      }
    `,
    variables: {user_id: userId, account_id: accountId},
  });
}

export function saveAccount(userId: string, apiKey: string, account: T) {
  const apollo = mkApollo(apiKey);
  return apollo.mutate({
    mutation: gql`
      ${fragments}
      mutation UpsertAccount($account: accounts_insert_input!) {
        insert_accounts(
          objects: [$account],
          on_conflict: {
            constraint: accounts_pkey, 
            update_columns: [name, type, extra]
          }) {
          returning {id}
        }
      }
    `,
    variables: {account},
  });
}
