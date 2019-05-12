import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export interface T {
  user_id: string;
  tag: string;
}

export function loadTags(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{tags: T[]}>({
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
