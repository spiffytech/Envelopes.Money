/* tslint:disable:no-var-requires */
require('dotenv').config();
require('longjohn');

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import unauth from './src/routes/unauth';
import authed from './src/routes/authed';

const app = express();
app.use(morgan('combined'));
app.use(cors({origin: [/https?:\/\/localhost:.*/, /https?:\/\/penguin.linux.test:.*/], credentials: true}));
app.use(express.json());
app.use(cookieParser());


app.use('/', unauth);
app.use('/api', authed);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
