/* tslint:disable:no-var-requires */
require('dotenv').config();

import cookieSession from 'cookie-session';
import cors from 'cors';
import express from 'express';
import httpProxy from 'http-proxy-middleware';
import morgan from 'morgan';
import * as path from 'path';

import unauth from './src/routes/unauth';
import * as sessions from './src/lib/sessions';

if (!process.env.GRAPHQL_ENDPOINT) throw new Error('Missing GRAPHQL_ENDPOINT');
if (!process.env.COOKIE_SECRET) throw new Error('Missing COOKIE_SECRET');
if (!process.env.SCRYPT_SALT) throw new Error('Missing SCRYPT_SALT');

const app = express();
app.use(morgan('combined'));
app.use(cors({origin: [/https?:\/\/localhost:.*/, /https?:\/\/penguin.linux.test:.*/], credentials: true}));
app.use(
  cookieSession({
    name: "session",
    secret: process.env.COOKIE_SECRET,
    maxAge: 1000 * 86400 * 14
  })
);

app.use('/', unauth);
app.use(
  '/v1alpha1/graphql',
  httpProxy({
    target: process.env.GRAPHQL_ENDPOINT,
    logLevel: 'debug',
    changeOrigin: true,
    prependPath: false,
  })
)

const authedRouter = express.Router();
authedRouter.use(async (req, res, next) => {
  console.log('req', req);
  console.log('credentials', req.session!.credentials);
  const apikey = sessions.apikeyFromRequest(req);
  if (!apikey) {
    res.statusCode = 500;
    console.log('Unauthorized');
    return res.send({error: 'unauthorized'})
  }

  const session = await sessions.lookUpSession(apikey);
  if (!session) {
    res.statusCode = 500;
    console.log('Unauthorized');
    return res.send({error: 'unauthorized'})
  }

  req.userId = session.id;
  req.apikey = apikey;
  return next();
});

authedRouter.get('/credentials', (req, res) => {
  res.json({apikey: req.session!.credentials.apikey, userId: req.session!.credentials.userId});
});
app.use('/api', authedRouter);

// Serve static files for React
app.use(express.static(path.join(__dirname, '../../../client', 'public')))
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Envelopes.Money is listening on port ${port}!`));
