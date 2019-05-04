import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export function loadTopLabels({userId, apikey}) {
  const apollo = mkApollo(apikey);
  return apollo.query({
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
