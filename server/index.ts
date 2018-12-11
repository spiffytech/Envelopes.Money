/* tslint:disable:no-var-requires */
require('dotenv').config();

import cors from 'cors';
import express from 'express';
import shortid from 'shortid';

import mkApollo from './lib/apollo';
import * as crypto from './lib/crypto';
import gql from 'graphql-tag';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/signup', async (req, res) => {
  try {
    if (!/\S+@\S+\.\S+/.test(req.body.email)) {
      console.error(`"${req.body.email}" is not a valid email address`);
      res.statusCode = 422;
      res.send({error: 'Email is not formatted like an email'});
      return;
    }
    const hash = await crypto.encode(req.body.password);
    console.log(req.headers);
    const userToken = req.headers['authorization'];
    if (!userToken) {
      console.error('User did not supply Authorization header');
      res.statusCode = 500;
      res.send({error: 'Must supply Authorization header'});
      return;
    }
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
        objects: [{id: shortid.generate(), email: req.body.email, scrypt: hash}],
      },
    }));
    console.log(`Signed up ${req.body.email}`);
    res.send();
  } catch(ex) {
    console.error(ex);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
