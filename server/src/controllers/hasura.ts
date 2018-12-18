import express from 'express';

import * as sessions from '../lib/sessions';

export async function authHook(req: express.Request, res: express.Response) {
  const tokenRaw = req.get('Authorization');
  if (!tokenRaw) {
    res.json({'x-hasura-role': 'anonymous'});
    return;
  }

  const apikey = tokenRaw.split(' ')[1];
  if (!apikey) {
    res.json({'x-hasura-role': 'anonymous'});
    return;
  }

  console.log(apikey)
  const user = await sessions.lookUpSession(apikey);
  console.log(user)
  if (!user) {
    res.json({'x-hasura-role': 'anonymous'});
    return;
  }

  console.log({
    'x-hasura-role': 'owner',
    'x-hasura-user-id': user.id,
  });
  res.json({
    'x-hasura-role': 'owner',
    'x-hasura-user-id': user.id,
  });
}
