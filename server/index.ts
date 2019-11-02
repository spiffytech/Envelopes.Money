/* tslint:disable:no-var-requires */
require("dotenv").config();

import cookieSession from "cookie-session";
import cors from "cors";
import Debug from 'debug';
import express from "express";
import gql from 'graphql-tag';
import morgan from "morgan";
import * as path from "path";
import plaid from 'plaid';

import mkApollo from './src/lib/apollo';
import unauth from "./src/routes/unauth";
import * as sessions from "./src/lib/sessions";

if (!process.env.GRAPHQL_ENDPOINT) throw new Error("Missing GRAPHQL_ENDPOINT");
if (!process.env.COOKIE_SECRET) throw new Error("Missing COOKIE_SECRET");
if (!process.env.SCRYPT_SALT) throw new Error("Missing SCRYPT_SALT");

const plaidClientId = process.env.PLAID_CLIENT_ID;
if (!plaidClientId) throw new Error('Missing PLAID_CLIENT_ID');
const plaidSecret = process.env.PLAID_SECRET;
if (!plaidSecret) throw new Error('Missing PLAID_SECRET');
const plaidPublicKey = process.env.PLAID_PUBLIC_KEY;
if (!plaidPublicKey) throw new Error('Missing PLAID_PUBLIC_KEY');
const plaidEnvironment = process.env.PLAID_ENV;
if (!plaidEnvironment) throw new Error('Missing PLAID_ENV');

const debug = Debug('Envelopes.Money:app');

const app = express();
app.use(morgan("combined"));
app.use(
  cors({
    origin: [/https?:\/\/localhost:\d*/, /https?:\/\/penguin.linux.test:.*/],
    credentials: true
  })
);
app.use(
  cookieSession({
    name: "Envelopes.Money",
    secret: process.env.COOKIE_SECRET,
    maxAge: 1000 * 86400 * 14,
    signed: false
  })
);

if (!process.env.POUCH_ONLY) {
  app.use("/auth", unauth);

  const authedRouter = express.Router();
  authedRouter.use(async (req, res, next) => {
    const apikey = sessions.apikeyFromRequest(req);
    if (!apikey) {
      res.statusCode = 401;
      console.log("No API key in request");
      return res.send({ error: "unauthorized" });
    }

    const session = await sessions.lookUpSession(apikey);
    if (!session) {
      res.statusCode = 401;
      console.error("No session for that API key");
      return res.send({ error: "unauthorized" });
    }

    req.userId = session.id;
    req.apikey = apikey;
    return next();
  });

  authedRouter.get("/credentials", (req, res) => {
    res.json({
      email: req.session!.credentials.email,
      password: req.session!.credentials.password,
      apikey: req.session!.credentials.apikey,
      userId: req.session!.credentials.userId
    });
  });

  authedRouter.post('/plaid/getAccessToken', express.json(), async (req, res) => {
    if (!plaidClientId || !plaidSecret || !plaidPublicKey || !plaidEnvironment) {
      console.error('Missing Plaid configuration');
      res.status(500);
      return res.json({error: 'Invalid Plaid configuration'});
    }
    const plaidClient = new plaid.Client(
      plaidClientId,
      plaidSecret,
      plaidPublicKey,
      plaid.environments[plaidEnvironment],
      {version: '2019-05-29'},

    );

    const publicToken = req.body.publicToken;
    if (!publicToken) {
      res.status(400);
      return res.json({error: 'Missing publicToken'});
    }
    const accountId = req.body.accountId;
    if (!accountId) {
      res.status(400);
      return res.json({error: 'Missing accountId'});
    }
    
    plaidClient.exchangePublicToken(publicToken, async (error, tokenResponse) => {
      if (error !== null) {
        console.error(error);
        res.status(500);
        return res.json({error: 'Trouble linking the account with Plaid'});
      }

      const apollo = await mkApollo(process.env.HASURA_ADMIN_KEY!, true);
      try {
        await apollo.mutate({
          mutation: gql`
            mutation StorePlaidLink($access_token: String!, $item_id: String!, $user_id: String!, $account_id: String!) {
              insert_plaid_links(objects: {
                access_token: $access_token,
                item_id: $item_id,
                user_id: $user_id
              }) {
                returning {
                  item_id
                }
              }

              update_accounts(_set: {plaid_item_id: $item_id}, where: {id: {_eq: $account_id}}) { returning {id} }
            }
          `,
          variables: {
            access_token: tokenResponse.access_token,
            item_id: tokenResponse.item_id,
            user_id: req.userId,
            account_id: accountId,
          },
        });
      } catch (ex) {
        console.error(ex);
        res.status(500);
        res.json({error: 'Could not store Plaid item into database'});
      }
      console.log(JSON.stringify(tokenResponse, null, 4));
      res.json({});
    });
  })

  app.use("/api", authedRouter);
} else {
  debug('Using PouchDB exclusively. No logins supported.');
}


// Serve static files for React
app.use(express.static(path.join(__dirname, "../../../client", "public")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../client", "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Envelopes.Money is listening on port ${port}!`)
);
