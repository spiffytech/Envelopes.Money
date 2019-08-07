import Debug from 'debug';
import immer from 'immer';
import flatten from 'ramda/es/flatten';
import groupBy from 'ramda/es/groupBy';
import identity from 'ramda/es/identity';
import map from 'ramda/es/map';
import sum from 'ramda/es/sum';
import { derived, get as storeGet, writable } from 'svelte/store';

const debug = Debug('Envelopes.Money:store');
window.storeGet = storeGet;

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

export const connectionStore = writable('disconnected');
export const credsStore = writable(null);
export const wsclientStore = writable(null);
export const syncStore = writable(null);
export const navStore = writable(false);
export const intervalStore = writable(localStorage.getItem('fillInterval') || 'monthly');

intervalStore.subscribe(value => localStorage.setItem('fillInterval', value));

window.balancesStore = balancesStore;
window.transactionsStore = transactionsStore;
window.accountsStore = accountsStore;
window.credsStore = credsStore;
