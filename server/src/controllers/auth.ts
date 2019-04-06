import bs58 from 'bs58';
import express from 'express';
import gql from 'graphql-tag';
import {crypto as nodeCrypto} from 'mz';
import shortid from 'shortid';

import mkApollo from '../lib/apollo';
import * as crypto from '../lib/crypto';
import * as sessions from '../lib/sessions';

function setCookie(res: express.Response, apikey: string, userId: string) {
  const maxAge = 86400 * 1000 * 14
  // Lets the browser see how long the session will last
  res.cookie('sessionAlive', maxAge.toString(), {maxAge, httpOnly: false});
  // Holds our actual session auth information
  res.cookie('apikey', apikey, {maxAge, httpOnly: false});
  res.cookie('userId', userId, {maxAge, httpOnly: false});
}

export async function signUp(req: express.Request, res: express.Response) {
  try {
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
      console.error(`"${req.body.email}" is not a valid email address`);
      res.statusCode = 422;
      res.send({error: 'Email is not formatted like an email'});
      return;
    }
    const hash = await crypto.encode(req.body.password);
    console.log(req.headers);
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
    console.log(apikey);

    const userId = shortid.generate()
    const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
    console.log(await apollo.mutate({
      mutation: gql`
        mutation SignUp($objects: [users_insert_input!]!) {
          insert_users(objects: $objects) {
            returning {
              id
            }
          }
        }
      `,
      variables: {
        objects: [{
          id: userId,
          email: req.body.email,
          scrypt: hash,
          apikey,
        }],
      },
    }));
    console.log(`Signed up ${req.body.email}`);
    setCookie(res, apikey, userId);
    res.send({success: true});
  } catch(ex) {
    console.error(ex);
  }
}

export async function logIn(req: express.Request, res: express.Response) {
  try {
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
      console.error(`"${req.body.email}" is not a valid email address`);
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

    setCookie(res, user.apikey, user.id);
    res.send({success: true, userId: user.id, apikey: user.apikey});
  } catch(ex) {
    console.error(ex);
    res.statusCode = 500;
    res.send({error: 'unknown error'});
  }
}
