/* tslint:disable:no-var-requires */
require('dotenv').config();

import cors from 'cors';
import express from 'express';

import unauth from './src/routes/unauth';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'));

app.use('/', unauth);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
