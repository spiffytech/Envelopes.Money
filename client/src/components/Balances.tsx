import flatten from 'lodash/flatten';
import groupBy from 'lodash/groupBy';
import localForage from 'localforage';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import * as Balances2 from '../lib/Balances';
import Balance from './Balance';
import * as cache from '../lib/cache';
import { toDollars } from '../lib/pennies';
import { AuthStore, FlashStore } from '../store';

export default function Balances() {
  const [balances, setBalances] = useState<Balances2.T[]>([]);

  const groups = groupBy(balances, (balance) => balance.type);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const envelopesByTag = groups['envelope'] ? groupBy(
    groups['envelope'].filter(Balances2.isBalanceEnvelope),
    (envelope: Balances2.BalanceEnvelope) => selectedTag ? envelope.tags[selectedTag] || '' : null
  ) : {};

  const allTags = groups['envelope'] ? Array.from(new Set(flatten(
    groups['envelope'].
      filter(Balances2.isBalanceEnvelope).
      map((envelope) => Object.keys(envelope.tags))
  ))).sort((a, b) => !a ? 1 : a < b ? -1 : 1) : [];

  useEffect(() => {
    async function fetchBalances() {
      try {
        cache.withCache(
          'balances',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return Balances2.loadBalances(AuthStore.userId, AuthStore.apiKey);
          },
          (data) => setBalances(data.data.balances),
        )
      } catch (ex) {
        FlashStore.flash = ex.message
        FlashStore.type = 'error';
      }
    }

    fetchBalances();
  }, []);

  const localForageTagKey = 'selectedTag';
  useEffect(() => {
    localForage.getItem<string>(localForageTagKey).then((tag) => {
      if (tag) setSelectedTag(tag);
    });
  });

  async function selectTag(tag: string) {
    await localForage.setItem(localForageTagKey, tag);
    setSelectedTag(tag || null);
  }

  return (
    <div>
      {groups['account'] ?
        <div>
          <header className='font-bold text-base lg:text-lg'>Accounts</header>
          {groups['account'].map((balance) =>
            <Link
              to={`/editAccount/${encodeURIComponent(balance.id)}`}
              className='flex justify-between p-3 border rounded border-grey-light no-underline text-black'
              key={balance.id}
            >
              <Balance balance={balance} />
            </Link>
          )}
        </div>
        : null
      }

      <select
        value={selectedTag || ''}
        onChange={(event) => selectTag(event.target.value)}
      >
        <option value={''}>Select a tag</option>
        {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
      </select>

      {groups['envelope'] ?
        <div>
          <header className='font-bold text-base lg:text-lg'>Envelopes</header>
          {Object.entries(envelopesByTag).map(([tagValue, envelopes]) =>
            <div key={tagValue}>
              <header>
                {tagValue === 'null' ? 'No Value' : tagValue || 'No Value'}: &nbsp;
                {toDollars(envelopes.map((envelope) => envelope.balance).reduce((acc, item) => acc + item, 0))} / &nbsp;
                {toDollars(envelopes.map((envelope) => Balances2.calcAmountForPeriod(envelope)['monthly']).reduce((acc, item) => acc + item, 0))}
              </header>
              {envelopes.map((balance) =>
                <Link
                  to={`/editAccount/${encodeURIComponent(balance.id)}`}
                  className='flex justify-between p-3 border rounded border-grey-light no-underline text-black'
                  key={balance.id}
                >
                  <Balance balance={balance} />
                </Link>
              )}
            </div>
          )}
        </div>
        : null
      }
    </div>
  );
}
