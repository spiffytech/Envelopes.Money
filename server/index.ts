/* tslint:disable:no-var-requires */
require('dotenv').config();

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import unauth from './src/routes/unauth';

const app = express();
app.use(cors({origin: [/https?:\/\/localhost:.*/], credentials: true}));
app.use(express.json());
app.use(cookieParser());

app.use('/', unauth);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
