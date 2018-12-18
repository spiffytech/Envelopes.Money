import 'isomorphic-fetch';

import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {onError} from 'apollo-link-error';
import {createHttpLink} from 'apollo-link-http';
import gql from 'graphql-tag';

function mkClient(token: string, isAdmin=false) {
  const uri = process.env.VUE_APP_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT;
  if (!uri) throw new Error('Missing Apollo GraphQL endpoint');
  const httpLink = createHttpLink({uri: process.env.VUE_APP_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT});
  const authLink = setContext((_, {headers}) => {
    return {
      headers: {
        ...headers,
        ...(isAdmin ? {'x-hasura-access-key': token} : {'Authorization': `Bearer ${token}`}),
      },
    };
  });

  /** Friendly error handling */
  const errorLink = onError(({graphQLErrors, networkError}) => {
    if (graphQLErrors) {
      graphQLErrors.map((error) =>
        console.error(
          `[GraphQL error]: ${JSON.stringify(error, null, 4)}`,
        ),
      );
    }

    if (networkError) console.error(`[Network error]: ${networkError}`);
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(errorLink).concat(httpLink),
  });

  return client;
}

export default mkClient;

export const fragments = gql`
      fragment transaction on transactions {
        id
        user_id
        memo
        date
        amount
        label
        type
      }
      
      fragment transaction_part on transaction_parts {
        id
        transaction_id
        user_id
        amount
        from_id
        to_id
      }
      
      fragment bucket on buckets {
        id
        user_id
        name
        type
        extra
      }
    `;
