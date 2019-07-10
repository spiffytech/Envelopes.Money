import gql from 'graphql-tag';

import {fragments} from './apollo';

export function isEnvelope(account) {
  return account.type === 'envelope';
}

export function loadAccounts({userId, apollo}) {
  return apollo.query({
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

export function loadAccount({userId, apollo}, accountId) {
  return apollo.query({
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

export function saveAccount({apollo}, account) {
  return apollo.mutate({
    mutation: gql`
      ${fragments}
      mutation UpsertAccount($account: accounts_insert_input!) {
        insert_accounts(
          objects: [$account],
          on_conflict: {
            constraint: accounts_pkey, 
            update_columns: [name, type, extra, tags]
          }) {
          returning {id}
        }
      }
    `,
    variables: {account},
  });
}

export async function subscribe(
  { userId, apollo },
  onData
) {
  return apollo
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
    })
    .subscribe({ next: onData });
}

export function mkEmptyEnvelope(userId) {
  return {
    id: '',
    user_id: userId,
    name: '',
    type: 'envelope',
    extra: { due: null, target: 0, interval: 'total' },
    tags: {},
  };
}

export function mkEmptyAccount(userId) {
  return {
    id: '',
    user_id: userId,
    name: '',
    type: 'account',
    extra: {},
  };
}
