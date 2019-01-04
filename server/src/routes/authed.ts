import express from 'express';
import * as accounts from '../controllers/accounts';
import * as transactions from '../controllers/transactions';
import * as sessions from '../lib/sessions';

const router = express.Router();
export default router;

router.use(async (req, res, next) => {
  console.log('here');
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
  console.log('Authorized');
  return next();
});

router.
  get('/transactions', transactions.getTransactions).
  post('/transactions/upsert', transactions.upsertTransaction).
  post('/transactions/delete', transactions.deleteTransaction).
  get('/accounts/balances', accounts.getBalances).
  post('/accounts/upsert', accounts.saveEnvelope);
