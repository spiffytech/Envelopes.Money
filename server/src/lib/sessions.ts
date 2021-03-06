import Debug from 'debug';
import express from 'express';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';

if (!process.env.HASURA_ADMIN_KEY) throw new Error('Must supply HASURA_ADMIN_KEY');

const debug = Debug('Envelopes.Money:sessions');

export function apikeyFromRequest(req: express.Request) {
  debug('Session is new? %s', req.session!.isNew)
  debug('Credentials: %s', JSON.stringify(req.session!.credentials));
  if (req.query.apikey) return req.query.apikey

  if (!req.session!.credentials) return null;
  if (!req.session!.credentials.apikey) return null;
  return req.session!.credentials.apikey;
}

interface User {
  id: string; emai: string; scrypt: string, apikey: string;
}

export async function lookUpSession(apikey: string, isAdmin=true) {
  const apollo = await mkApollo(isAdmin ? process.env.HASURA_ADMIN_KEY! : apikey, isAdmin);
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
      query LookUpUser($email: String!) {
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
