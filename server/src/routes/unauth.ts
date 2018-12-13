import express from 'express';
import * as auth from '../controllers/auth';


const router = express.Router();
export default router;

router.
  post('/signup', auth.signUp);
