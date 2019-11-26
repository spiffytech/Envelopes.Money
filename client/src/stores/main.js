import Debug from 'debug';
import immer from 'immer';
import flatten from 'ramda/es/flatten';
import fromPairs from 'ramda/es/fromPairs';
import groupBy from 'ramda/es/groupBy';
import identity from 'ramda/es/identity';
import map from 'ramda/es/map';
import sum from 'ramda/es/sum';
import { derived, get as storeGet, Readable, writable, Writable } from 'svelte/store';

import * as libtransactions from '../lib/Transactions';

/** @typedef {import('../types.d').TransactionGroup} TransactionGroup */
/** @typedef {import('../types.d').Transaction} Transaction*/
/** @typedef {import('../types.d').TransactionWithAccounts} TransactionWithAccounts */
/** @typedef {import('../types.d').Account} Account */

const debug = Debug('Envelopes.Money:store');
window.storeGet = storeGet;

/** @type {Writable<Transaction[]>} */
export const transactionsStore = writable(immer([], identity));
/** @type {Writable<Account[]>} */
export const accountsStore = writable(immer([], identity));

export const accountsMapStore = derived(
  accountsStore,
  $accounts => fromPairs($accounts.map(account => [account.id, account]))
);

/** @type {Readable<TransactionGroup[]>} */
export const txnGroupStore = derived(
  [transactionsStore, accountsMapStore],
  /** @type {([$transactions, $accountsMap]: [Transaction[], {[key: string]: Account}]) => TransactionGroup[]} */
  ([$transactions, $accountsMap]) => {
    /** @type {TransactionWithAccounts[]} */
    const txnsWithAccounts = $transactions.map(txn => ({
      transaction: txn,
      from: $accountsMap[txn.from_id],
      to: $accountsMap[txn.to_id],
    }));
    /** @type {TransactionGroup[]} */
    const txnGroups = libtransactions.group(txnsWithAccounts);
    return txnGroups;
  }
);

export const balancesStore = derived(
  [transactionsStore, accountsStore],
  ([$transactions, $accounts]) => {
    debug('Calculating balances');
    const activity = flatten($transactions.map(transaction => [
      {account: transaction.from_id, amount: -transaction.amount},
      {account: transaction.to_id, amount: transaction.amount * (transaction.type === 'banktxn' ? -1 : 1)}
    ]));
    const activityByAccount = groupBy(({account}) => account, activity);
    const ret = map(rows => sum(rows.map(({amount}) => amount)), activityByAccount)
    // If we have an empty account it won't show up in our transactions list.
    // Detect such cases and set the balance to zero.
    $accounts.forEach(account => {
      if (!ret[account.id]) ret[account.id] = 0;
    });
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
window.txnGroupStore = txnGroupStore;
