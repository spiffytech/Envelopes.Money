import 'isomorphic-fetch';

/* tslint:disable:no-var-requires */
// require('dotenv').config();

import {InMemoryCache} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {onError} from 'apollo-link-error';
import {createHttpLink} from 'apollo-link-http';
import gql from 'graphql-tag';

const httpLink = createHttpLink({uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || process.env.GRAPHQL_ENDPOINT});
const authLink = setContext((_, {headers}) => {
  const token = process.env.REACT_APP_GRAPHQL_TOKEN || process.env.GRAPHQL_TOKEN;
  return {
    headers: {
      ...headers,
      'X-Hasura-Access-Key': token,
    },
  };
});

/** Friendly error handling */
const errorLink = onError(({graphQLErrors, networkError}) => {
  if (graphQLErrors) {
    graphQLErrors.map((error) =>
      console.log(
        `[GraphQL error]: ${JSON.stringify(error, null, 4)}`,
      ),
    );
  }

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(errorLink).concat(httpLink),
});

export default client;

async function main() {
  const result = await client.query({
    query: gql`
      {
        transaction {
          id
          from {
            id
          }
          to {
            bucket {
              id
            }
          }
        }
      }
    `,
  });

  console.log(JSON.stringify(result, null, 4));

  await client.mutate({
    mutation: gql`
      mutation insertCategory($objects: [category_insert_input!]!) {
        insert_category(objects: $objects
        ) { affected_rows }
      }
    `,
    variables: {
      objects: [
        {
          id: 'cows',
          name: 'turtles',
          interval: 'weekly',
          due: '2018-10-10',
          target: 500,
        }
      ]
    }
  });
}

if (require.main === module) main().catch(console.error);
