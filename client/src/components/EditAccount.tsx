import {format} from 'date-fns';
import {RouteComponentProps, Redirect} from 'react-router-dom';
import {History} from 'history';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import '../lib/core.css';
import * as Accounts from '../lib/Accounts';
import * as Tags from '../lib/Tags';
import {AuthStore} from '../store';

async function handleSubmit(event: React.FormEvent<any>, account: Accounts.T, history: History) {
  event.preventDefault();
  if (!AuthStore.loggedIn) throw new Error('You must be logged in to do this');

  const {__typename, ...rest} = account as Accounts.T & {__typename: any};
  await Accounts.saveAccount(
    AuthStore.userId,
    AuthStore.apiKey,
    {...rest, id: rest.id === '' ? `${rest.type}/${shortid.generate()}` : rest.id},
  );
  history.push('/');
}

export default function EditAccount(props: RouteComponentProps<{accountId: string}>) {
  if (!AuthStore.loggedIn) return <p>You must be logged in to do this</p>;

  const accountId = props.match.params.accountId ? decodeURIComponent(props.match.params.accountId) : null;

  console.log(props);

  const emptyEnvelope: Accounts.Envelope = {
    id: '',
    user_id: AuthStore.userId,
    name: '',
    type: 'envelope',
    extra: {due: null, target: 0, interval: 'total'},
    tags: {},
  };
  const emptyBankAccount: Accounts.BankAccount = {
    id: '',
    user_id: AuthStore.userId,
    name: '',
    type: 'account',
    extra: {},
  };

  const [is404, setIs404] = useState(false);
  const [account, setAccount] = useState<Accounts.T>(emptyEnvelope);
  const [canChangeType, setCanChangeType] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState({key: '', value: ''});

  console.log('account', account);
  useEffect(() => {
    if (!accountId) return;  // Not loading an existing account
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    Accounts.loadAccount(AuthStore.userId, AuthStore.apiKey, accountId).
    then(({data}) => {
      console.log(data)
      if (data.accounts.length === 0) return setIs404(true);
      setAccount(data.accounts[0])
      setCanChangeType(false);
    });
  }, [props.match.params.accountId]);

  useEffect(() => {
    async function loadTags() {
      if (!AuthStore.loggedIn) throw new Error('User must be logged in');
      const {data} = await Tags.loadTags(AuthStore.userId, AuthStore.apiKey);
      setAllTags(data.tags.map(({tag}) => tag));
    }
    loadTags();
  }, []);

  if (is404) return <Redirect to='/404' />

  function setAccountType(type: 'envelope' | 'account') {
    if (type === account.type) return;
    setAccount(type === 'envelope' ? emptyEnvelope : emptyBankAccount);
  }

  return (
    <form
      className='area'
      style={{gridArea: 'content'}}
      onSubmit={(event) => handleSubmit(event, account, props.history)}
    >
      <header>{account.name}</header>
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

          <header>Tags</header>
          <div>
            {allTags.map((tag) => 
              <div key={tag}>
                <label>
                  {tag}
                  <input
                    value={account.tags[tag] || ''}
                    onChange={(event) => setAccount({...account, tags: {...account.tags, [tag]: event.target.value}})}
                  />
                </label>
              </div>
            )}

            <input
              placeholder='Name'
              value={newTag.key}
              onChange={(event) => setNewTag({...newTag, key: event.target.value})}
            />
            <input
              value={newTag.value}
              onChange={(event) => setNewTag({...newTag, value: event.target.value})}
            />
            <button onClick={(event) => {
              event.preventDefault();
              setAccount({...account, tags: {...account.tags, [newTag.key]: newTag.value}});
              setAllTags([...allTags, newTag.key]);  // Necessary to show the new tag value
              setNewTag({key: '', value: ''})
            }}>Add tag</button>
          </div>
        </>
      ) : null}

      <button type='submit'>Save {account.type}</button>
    </form>
  );
}
