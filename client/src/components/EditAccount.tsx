import {navigate, RouteComponentProps} from '@reach/router';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import * as Accounts from '../lib/Accounts';
import {AuthStore} from '../store';
import { Z_PARTIAL_FLUSH } from 'zlib';

async function handleSubmit(event: React.FormEvent<any>, account: Accounts.T) {
  event.preventDefault();
  if (!AuthStore.loggedIn) throw new Error('You must be logged in to do this');

  const {__typename, ...rest} = account as Accounts.T & {__typename: any};
  await Accounts.saveAccount(
    AuthStore.userId,
    AuthStore.apiKey,
    {...rest, id: rest.id === '' ? `${rest.type}/${shortid.generate()}` : rest.id},
  );
  navigate('/');
}

export default function EditAccount(props: RouteComponentProps & {accountId?: string}) {
  console.log(props.accountId);

  if (!AuthStore.loggedIn) return <p>You must be logged in to do this</p>;

  const [account, setAccount] = useState<Accounts.T>({
    id: '',
    user_id: AuthStore.userId,
    name: '',
    type: 'envelope',
    extra: {},
  });
  const [canChangeType, setCanChangeType] = useState(true);

  useEffect(() => {
    if (!props.accountId) return;  // Now loading an existing account
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    Accounts.loadAccount(AuthStore.userId, AuthStore.apiKey, props.accountId).
    then(({data}) => {
      if (data.accounts.length === 0) return navigate('/404');
      setAccount(data.accounts[0])
      setCanChangeType(false);
    });
  }, []);

  function setAccountProp(props: Partial<Accounts.T>) {
    setAccount({...account, ...props});
  }

  return (
    <form onSubmit={(event) => handleSubmit(event, account)}>
      <p>{JSON.stringify(account)}</p>

      <input
        value={account.name}
        onChange={(event) => setAccount({...account, name: event.target.value})}
      />

      <select
        value={account.type}
        onChange={(event) => setAccount({...account, type: event.target.value})}
        disabled={!canChangeType}
      >
        <option value='envelope'>Envelope</option>
        <option value='account'>Account</option>
      </select>

      <button type='submit'>Save {account.type}</button>
    </form>
  );
}
