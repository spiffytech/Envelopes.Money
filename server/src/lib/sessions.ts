import express from 'express';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';

export function apikeyFromRequest(req: express.Request) {
  if (!req.cookies.session) {
    if (!req.query.apikey) {
      return null;
    }

    return req.query.apikey;
  }
  return req.cookies.session;
}

interface User {
  id: string; emai: string; scrypt: string, apikey: string;
}

export async function lookUpSession(apikey: string) {
  const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
  const result = await apollo.query<{users: User[]}>({
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

export async function lookUpUser(email: string) {
  const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
  const result = await apollo.query<{users: any}>({
    query: gql`
      query LookUpUSer($email: String!) {
        users(where: {email: {_eq: $email}}) {
          id
          scrypt
          apikey
        }
      }
    `,
    variables: {email},
  });

  return result.data.users[0];
}
