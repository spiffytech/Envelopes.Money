import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export function loadTags({userId, apollo}) {
  return apollo.query({
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
export function updateAccountsTags({userId, apollo}, accounts) {
  const promises = Object.entries(accounts).map(([account, tags]) => {
    return apollo.mutate({
      mutation: gql`
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
export function deleteTagFromAccounts({userId, apollo}, tag, accounts) {
  return apollo.mutate({
    mutation: gql`
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
