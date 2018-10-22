import 'isomorphic-fetch';

/* tslint:disable:no-var-requires */
// require('dotenv').config();

import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {onError} from 'apollo-link-error';
import {createHttpLink} from 'apollo-link-http';

function mkClient(token: string) {
  const uri = process.env.REACT_APP_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT;
  if (!uri) throw new Error('Missing Apollo GraphQL endpoint');
  const httpLink = createHttpLink({uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT});
  const authLink = setContext((_, {headers}) => {
    return {
      headers: {
        ...headers,
        'Authorization': `Bearer ${token}`,
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
