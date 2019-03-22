import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export interface T {
  label: string;
  count: number;
  to_id: string;
  user_id: string;
  name: string;
}

export function loadTopLabels(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{top_labels: T[]}>({
    query: gql`
      ${fragments}
      query GetTopLabels($user_id: String!) {
        top_labels(where: {user_id: {_eq: $user_id}}) {
          ...top_label
        }
      }
    `,
    variables: {user_id: userId},
  });
}
