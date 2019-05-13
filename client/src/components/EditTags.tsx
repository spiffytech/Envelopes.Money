import fromPairs from 'lodash/fromPairs';
import { Observer, useLocalStore } from "mobx-react-lite"
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import {useEffect} from 'react';

import * as Accounts from '../lib/Accounts';
import { AuthStore } from '../store';
import * as Tags from '../lib/Tags';

export default function EditTags(props: RouteComponentProps<{}>) {
  const store = useLocalStore(() => ({
    selectedTag: null as string | null,
    envelopes: [] as Accounts.Envelope[],
    error: null as string | null,
    tags: [] as string[],
    setTags(tags: string[]) {
      this.tags = tags;
    },
    setEnvelopes(envelopes: Accounts.Envelope[]) {
      this.envelopes = envelopes;
    },
  }));

  useEffect(() => {
    async function fetchData() {
      if (!AuthStore.loggedIn) throw new Error('User must be logged in');
      const {data: tags} = await Tags.loadTags(AuthStore.userId, AuthStore.apiKey);
      store.setTags(tags.tags.map(({tag}) => tag));

      const {data: accounts} = await Accounts.loadAccounts(AuthStore.userId, AuthStore.apiKey);
      store.setEnvelopes(
        accounts.accounts
        .filter(Accounts.isEnvelope)
        .sort((a, b) => a.name < b.name ? -1 : 1)
      );
    }

    fetchData();
  }, [store]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const selectedTag = store.selectedTag;
    if (selectedTag === null) {
      store.error = 'Must select a tag before saving';
      return;
    }
    const accountsWithSelectedTag = fromPairs(
      store.envelopes
      .filter((account) => account.tags[selectedTag])
      .map((account) => [account.id, {[selectedTag]: account.tags[selectedTag]}])
    );

    const accountsWithoutSelectedTag =
      store.envelopes
      .filter((account) => !account.tags[selectedTag])
      .map((account) => account.id);
  
    if (!AuthStore.userId || !AuthStore.loggedIn) {
      store.error = 'Must be logged in';
      return;
    }
    try {
      await Tags.updateAccountsTags(AuthStore, accountsWithSelectedTag)
      await Tags.deleteTagFromAccounts(AuthStore, selectedTag, accountsWithoutSelectedTag);
      store.error = null;
      props.history.push('/');
    } catch (ex) {
      store.error = ex.message;
      throw ex;
    }  }

  return <div className='flex justify-around'>
    {store.error ? <p>store.error</p> : null}

    <Observer>{() =>
      <form onSubmit={handleSubmit}>
        <select
          value={store.selectedTag || ''}
          onChange={(event) => store.selectedTag = event.target.value}
          className='border'
        >
          <option value={''}>Select a tag</option>
          {store.tags.map((tag) => <option value={tag} key={tag}>{tag}</option>)}
        </select>

        {store.selectedTag === null ? null : 
          <>
            {store.envelopes.map((envelope) =>
              <div key={envelope.id}>
                <label className='label'>
                  {envelope.name}
                  <input
                    className='input'
                    value={envelope.tags[store.selectedTag!] || ''}
                    onChange={(event) => envelope.tags[store.selectedTag!] = event.target.value}
                  />
                </label>
              </div>
            )}

            <div>
              <button type='submit' className='link-btn link-btn-primary'>Save Tags</button>
            </div>
          </>
        }
      </form>
    }</Observer>
  </div>
}
