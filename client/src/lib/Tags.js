import gql from 'graphql-tag';

import {fragments} from '../lib/apollo';

export function loadTags({userId, wsclient}) {
  return wsclient.query({
    query: gql`
      ${fragments}
      query GetTags($user_id: String!) {
        tags(where: {user_id: {_eq: $user_id}}) {
          ...tag
        }
      }
    `,
    variables: {user_id: userId},
  });
}

/**
 * Sets the given tag from the given accounts
 * @param {{accountId: string]: {[tag: string]: any}}} accounts 
 */
export function updateAccountsTags({userId, wsclient}, accounts) {
  const promises = Object.entries(accounts).map(([account, tags]) => {
    return wsclient.query({
      query: gql`
        mutation UpdateTags($user_id: String! $account: String!, $tags: jsonb) {
          update_accounts(
            where: {_and: [{user_id: {_eq: $user_id}}, {id: {_eq: $account}}]},
            _append: {tags: $tags}
          ) {
            returning {id}
          }
        }
      `,
      variables: {user_id: userId, account, tags}
    });
  })

  return Promise.all(promises);
}

/**
 * Removes the given tag from the given accounts
 * @param {string} tag
 * @param {string[]} accounts
 */
export function deleteTagFromAccounts({userId, wsclient}, tag, accounts) {
  return wsclient.query({
    query: gql`
      mutation DeleteTags($user_id: String!, $tag: String!, $accounts: [String!]!) {
        update_accounts(
          where: {_and: [{user_id: {_eq: $user_id}}, {id: {_in: $accounts}}]},
          _delete_at_path: {tags: [$tag]}
        ) {
          returning {id}
        }
      }
    `,
    variables: {user_id: userId, accounts, tag}
  });
}
