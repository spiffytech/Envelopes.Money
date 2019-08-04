import comparator from 'ramda/es/comparator';
import Debug from 'debug';
import immer from 'immer';
import flatten from 'ramda/es/flatten';
import groupBy from 'ramda/es/groupBy';
import identity from 'ramda/es/identity';
import map from 'ramda/es/map';
import sum from 'ramda/es/sum';
import uniq from 'ramda/es/uniq';
import { derived, get as storeGet, writable } from 'svelte/store';

const debug = Debug('Envelopes.Money:store');
window.storeGet = storeGet;

export const store = writable({
  searchTerm: '',
  accounts: {},
  periodLength: 15,

  connecting: false,
  connected: false,
  loadedItems: {
    accounts: false,
  },
});

export const arrays = derived(store, $store => {
  return {
    ...$store,
    isLoading: !Object.values($store.loadedItems).every(identity),

    envelopes: Object.values($store.accounts)
      .filter(b => b.type === 'envelope')
      .sort(comparator((a, b) => a.name < b.name)),
    accounts: Object.values($store.accounts)
      .filter(b => b.type === 'account')
      .sort(comparator((a, b) => a.name < b.name)),
    tags: uniq(
      flatten(
        Object.values($store.accounts)
          .filter(account => account.type === 'envelope')
          .map(account => account.tags)
          .map(tags => Object.keys(tags))
      )
    ).sort(),
  };
});

export const pouchStore = writable(
  immer({ state: 'offline', stateDetail: null }, identity)
);

export const transactionsStore = writable(immer([], identity));
export const accountsStore = writable(immer([], identity));

export const balancesStore = derived(
  transactionsStore,
  $transactions => {
    debug('Calculating balances');
    const activity = flatten($transactions.map(transaction => [
      {account: transaction.from_id, amount: -transaction.amount},
      {account: transaction.to_id, amount: transaction.amount * (transaction.type === 'banktxn' ? -1 : 1)}
    ]));
    const activityByAccount = groupBy(({account}) => account, activity);
    const ret = map(rows => sum(rows.map(({amount}) => amount)), activityByAccount)
    debug('Done calculating balances');
    return ret;
  }
);

window.store = store;
window.derivedStore = arrays;
window.balancesStore = balancesStore;
window.transactionsStore = transactionsStore;
window.accountsStore = accountsStore;
