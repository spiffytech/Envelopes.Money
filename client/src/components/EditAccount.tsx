import {format} from 'date-fns';
import {navigate, RouteComponentProps} from '@reach/router';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import * as Accounts from '../lib/Accounts';
import {AuthStore} from '../store';

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

  const emptyEnvelope: Accounts.Envelope = {
    id: '',
    user_id: AuthStore.userId,
    name: '',
    type: 'envelope',
    extra: {due: null, target: 0, interval: 'total'},
  };
  const emptyBankAccount: Accounts.BankAccount = {
    id: '',
    user_id: AuthStore.userId,
    name: '',
    type: 'account',
    extra: {},
  };

  const [account, setAccount] = useState<Accounts.T>(emptyEnvelope);
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

  function setAccountType(type: 'envelope' | 'account') {
    if (type === account.type) return;
    setAccount(type === 'envelope' ? emptyEnvelope : emptyBankAccount);
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
        onChange={(event) => setAccountType(event.target.value as any)}
        disabled={!canChangeType}
      >
        <option value='envelope'>Envelope</option>
        <option value='account'>Account</option>
      </select>

      {account.type === 'envelope' ? (
        <>
          <input
            type="date"
            value={format(account.extra.due || '', 'YYYY-MM-DD')}
            onChange={(event) =>
              setAccount({
                ...account,
                extra: {...account.extra, due: new Date(event.target.value)}
              })
            }
          />
          <button onClick={(e) => {
            e.preventDefault();
            setAccount({...account, extra: {...account.extra, due: null}})
          }}>Clear due date</button>

          <input
            type="number"
            step="0.01"
            value={account.extra.target / 100}
            onChange={(event) => setAccount({
              ...account, extra: {...account.extra, target: Math.round(parseFloat(event.target.value) * 100)}
            })}
          />

          <select
            value={account.extra.interval}
            onChange={(event) =>
              setAccount({
                ...account,
                extra: {...account.extra, interval: event.target.value as any}
              })
            }
          >
            <option value='total'>Total</option>
            <option value='weekly'>Weekly</option>
            <option value='monthly'>Monthly</option>
            <option value='annually'>Annually</option>
          </select>
        </>
      ) : null}

      <button type='submit'>Save {account.type}</button>
    </form>
  );
}
