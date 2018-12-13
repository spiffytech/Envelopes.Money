import express from 'express';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';

export function apikeyFromRequest(req: express.Request) {
  if (!req.cookies.session) {
    return null;
  }
  return req.cookies.session;
}

export async function lookUpSession(apikey: string) {
  const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
  const result = await apollo.query<{users: any}>({
    query: gql`
      query LookUpSession($apikey: String!) {
        users(where: {apikey: {_eq: $apikey}}) {
          id
        }
      }
    `,
    variables: {apikey},
  });

  return result.data.users[0];
}
