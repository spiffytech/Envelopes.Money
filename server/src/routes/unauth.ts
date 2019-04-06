import express from 'express';
import * as auth from '../controllers/auth';
import * as hasura from '../controllers/hasura';


const router = express.Router();
export default router;

router.
  post('/signup', auth.signUp).
  post('/login', express.json(), auth.logIn).
  get('/hasura_auth', hasura.authHook);
