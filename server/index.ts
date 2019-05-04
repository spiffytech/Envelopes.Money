/* tslint:disable:no-var-requires */
require('dotenv').config();
require('longjohn');

import cors from 'cors';
import express from 'express';
import httpProxy from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import * as path from 'path';

import unauth from './src/routes/unauth';
import authed from './src/routes/authed';

const app = express();
app.use(morgan('combined'));
app.use(cors({origin: [/https?:\/\/localhost:.*/, /https?:\/\/penguin.linux.test:.*/], credentials: true}));
// This breaks the GraphQL proxying
// app.use(express.json());
app.use(cookieParser());

app.use('/', unauth);
app.use('/api', authed);
if (!process.env.GRAPHQL_ENDPOINT) throw new Error('Missing GRAPHQL_ENDPOINT');
//app.use('/v1alpha1/graphql', httpProxy({target: process.env.GRAPHQL_ENDPOINT, logLevel: 'debug'}))
app.use(
  '/v1alpha1/graphql',
  httpProxy({
    target: process.env.GRAPHQL_ENDPOINT,
    logLevel: 'debug',
    changeOrigin: true,
    prependPath: false,
  })
)

// Serve static files for React
app.use(express.static(path.join(__dirname, '../../../client', 'public')))
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`HackerBudget listening on port ${port}!`));
