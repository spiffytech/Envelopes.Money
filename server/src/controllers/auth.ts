import bs58 from 'bs58';
import Debug from 'debug';
import express from 'express';
import gql from 'graphql-tag';
import {crypto as nodeCrypto} from 'mz';
import shortid from 'shortid';

import mkApollo from '../lib/apollo';
import * as crypto from '../lib/crypto';
import * as sessions from '../lib/sessions';

const debug = Debug('authentication');

function setSession(req: express.Request, apikey: string, userId: string) {
  req.session!.credentials = {
    email: req.body!.email,
    password: req.body!.password,
    apikey,
    userId,
  };
}

export async function signUp(req: express.Request, res: express.Response) {
  try {
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
      debug(`"${req.body.email}" is not a valid email address`);
      res.statusCode = 422;
      res.send({error: 'Email is not formatted like an email'});
      return;
    }
    const hash = await crypto.encode(req.body.password);
    /*
    const userToken = req.headers['authorization'];
    if (!userToken) {
      console.error('User did not supply Authorization header');
      res.statusCode = 500;
      res.send({error: 'Must supply Authorization header'});
      return;
    }
    */

    const apikey = bs58.encode(await nodeCrypto.randomBytes(32));

    const userId = shortid.generate()
    const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
    await apollo.mutate({
      mutation: gql`
        mutation SignUp($users: [users_insert_input!]!, $accounts: [accounts_insert_input!]!) {
          insert_users(objects: $users) {
            returning {
              id
            }
          }

          insert_accounts(objects: $accounts) {
            returning {
              id
            }
          }
        }
      `,
      variables: {
        users: [{
          id: userId,
          email: req.body.email,
          scrypt: hash,
          apikey,
        }],

        accounts: [
          {
            id: shortid.generate(),
            user_id: userId,
            name: '[Unallocated]',
            type: 'envelope',
            extra: {}
          },
          {
            id: shortid.generate(),
            user_id: userId,
            name: '[Equity]',
            type: 'account',
            extra: {}
          }
        ]
      },
    });
    debug(`Signed up ${req.body.email}`);
    setSession(req, apikey, userId);
    res.send({success: true, userId, apikey});
  } catch(ex) {
    console.error(ex);
  }
}

export async function logIn(req: express.Request, res: express.Response) {
  try {
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
      debug(`"${req.body.email}" is not a valid email address`);
      res.statusCode = 422;
      res.send({error: 'Email is not formatted like an email'});
      return;
    }

    const user = await sessions.lookUpUser(req.body.email);
    if (!user) {
      res.statusCode = 401;
      return res.json({error: 'Invalid credentials'});
    }

    const isPasswordValid = crypto.verify(user.scrypt, req.body.password);
    if (!isPasswordValid) {
      res.statusCode = 401;
      return res.json({error: 'Invalid credentials'});
    }

    setSession(req, user.apikey, user.id);
    debug('credentials: %s', JSON.stringify(req.session!.credentials));
    res.send({success: true, userId: user.id, apikey: user.apikey});
  } catch(ex) {
    console.error(ex);
    res.statusCode = 500;
    res.send({error: 'unknown error'});
  }
}
