import { get as getIdb, set as setIdb } from 'idb-keyval';
import comparator from 'ramda/es/comparator';
import Debug from 'debug';
import immer from 'immer';
import equals from 'ramda/es/equals';
import filter from 'ramda/es/filter';
import flatten from 'ramda/es/flatten';
import fromPairs from 'ramda/es/fromPairs';
import groupBy from 'ramda/es/groupBy';
import identity from 'ramda/es/identity';
import map from 'ramda/es/map';
import memoizeWith from 'ramda/es/memoizeWith';
import uniq from 'ramda/es/uniq';
import { derived, get as storeGet, writable } from 'svelte/store';

import * as Accounts from '../lib/Accounts';
import loadBalances from '../lib/loadBalances';
import * as Transactions from '../lib/Transactions';
import { formatDate, myDebounce } from '../lib/utils';
import { PouchAccounts, PouchTransactions } from '../lib/pouch';

const debug = Debug('Envelopes.Money:store');
window.storeGet = storeGet;

/**
 * Given a bunch of transactions, calculates which from+to account combo is the
 * most commonly used so we can suggest that for the user to quick-fill
 */
function calcFieldsForLabel(txnsArr) {
  if (txnsArr.length === 0) return {};
  txnsArr.sort(comparator((a, b) => a.date < b.date));

  const txnsByLabel = filter(
    arr => arr.length > 0,
    groupBy(txn => txn.label, txnsArr)
  );
  return map(txnsForLabel => {
    const groups = groupBy(txn => `${txn.from_id}-${txn.to_id}`, txnsForLabel);
    const biggestGroup = Object.values(groups).reduce(
      (biggest, item) => (item.length > biggest.length ? item : biggest),
      []
    );
    return { from_id: biggestGroup[0].from_id, to_id: biggestGroup[0].to_id };
  }, txnsByLabel);
}

export const store = writable({
  searchTerm: '',
  transactions: {},
  accounts: {},
  periodLength: 15,

  connecting: false,
  connected: false,
  loadedItems: {
    accounts: false,
    transactions: false,
  },
});

export const arrays = derived(store, $store => {
  const txnsArr = Object.values($store.transactions).sort(
    comparator((a, b) => a.date > b.date)
  );

  const labelQuickFills = calcFieldsForLabel(txnsArr);

  return {
    ...$store,
    isLoading: !Object.values($store.loadedItems).every(identity),

    envelopes: Object.values($store.accounts)
      .filter(b => b.type === 'envelope')
      .sort(comparator((a, b) => a.name < b.name)),
    accounts: Object.values($store.accounts)
      .filter(b => b.type === 'account')
      .sort(comparator((a, b) => a.name < b.name)),
    labelQuickFills,
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

function setLoaded(key) {
  store.update($store => {
    // Minimize rerenders by wrapping in a conditional
    if (!$store.loadedItems[key]) {
      return { ...$store, loadedItems: { ...$store.loadedItems, [key]: true } };
    }
    return $store;
  });
}

async function setPouchData(localDB, key, data) {
  debug('Storing data in Pouch: %o', data);
  const incoming = Object.values(data);
  const incomingInPouchForm = incoming.map(doc => ({
    ...doc,
    type_: key.replace(/s$/, ''),
    // TODO: Migrate 100% couch before this bites us with txns referencing accounts starting with an underscore
    _id: doc.id.replace(/^_+/, '☃︎'), // Couch reserves IDs starting with underscores for special things
    __typename: undefined,
  }));
  incomingInPouchForm.forEach(doc => delete doc['__typename']);
  const incomingDocIdsSet = new Set(incomingInPouchForm.map(({ _id }) => _id));

  const searchResults = await localDB.bulkGet({
    docs: Array.from(incomingDocIdsSet).map(id => ({ id })),
  });
  const existingDocs = flatten(
    searchResults.results.map(({ docs }) =>
      docs.filter(doc => doc.ok).map(({ ok }) => ok)
    )
  );

  debug('Incoming docs: %o', incomingInPouchForm);
  debug('Existing Pouch docs: %o', existingDocs);

  await Promise.all(
    existingDocs.map(existingDoc => {
      if (!incomingDocIdsSet.has(existingDoc._id)) {
        return localDB.remove(existingDoc);
      }
      return Promise.resolve(null);
    })
  );
  const existingById = fromPairs(existingDocs.map(doc => [doc._id, doc]));

  const toInsert = incomingInPouchForm
    .map(doc => {
      const { _rev, ...existing } = existingById[doc._id] || {};
      if (_rev && !equals(doc, existing)) {
        return { ...doc, _rev }; // Updated doc
      }
      if (!_rev) return doc; // New doc
      return null; // New doc matched old doc
    })
    .filter(identity);

  debug('Insertion result: %o', await localDB.bulkDocs(toInsert));
}

export async function subscribe(graphql) {
  const pendingData = {
    accounts: null,
    transactions: null,
  };

  let pouchIsInitialized = false;
  if (window._env_.USE_POUCH) {
    try {
      await graphql.localDB.get('initialized');
      pouchIsInitialized = true;
    } catch (ex) {
      if (ex.status !== 404) {
        throw ex;
      }
    }
  }

  const setData = async function setData(key, data, fromLocal = false) {
    debug(
      'setData called with key %s and data quantity %s',
      key,
      Object.values(data).length
    );
    // Use the OR so we keep the default datastructure instead of undefined if
    // IndexedDB returns an empty value on page load
    pendingData[key] = data || pendingData[key];
    if (!window._env_.USE_POUCH) await setIdb(key, data);

    // A bunch of our derived computations rely on all of the store data being
    // loaded. A partial load throws errors. So only set the values once they've
    // all arrived.
    const isReady = Object.values(pendingData).every(identity);
    if (isReady) {
      debug(
        'Store is ready, setting data %o',
        Object.values(pendingData).map(o => Object.values(o).length)
      );
      store.update($store => ({
        ...$store,
        ...pendingData,
      }));
    }
    //if (!fromLocal) setLoaded(key);
    setLoaded(key); // TODO: Distinguish loading from disk vs loading from network

    if (
      window._env_.USE_POUCH &&
      !window._env_.POUCH_ONLY &&
      !fromLocal &&
      !pouchIsInitialized
    ) {
      debug('Initializing pouchdb with data %o', pendingData);
      await Promise.all([
        setPouchData(graphql.localDB, 'accounts', pendingData.accounts),
        setPouchData(
          graphql.localDB,
          'transactions',
          pendingData.transactions
        )
      ]);
      await graphql.localDB.upsert('initialized', () => ({
        _id: 'initialized',
        initialized: true,
      }));
      debug('Initialized PouchDB');
    }
  };

  if (
    window._env_.USE_POUCH &&
    (window._env_.POUCH_ONLY || pouchIsInitialized)
  ) {
    debug('Reading data from Pouch');
    const pouchTransactions = new PouchTransactions(graphql.localDB);
    const pouchAccounts = new PouchAccounts(graphql.localDB);
    const txns = await pouchTransactions.loadAll();
    const accounts = await pouchAccounts.loadAll();
    setData(
      'accounts',
      fromPairs(accounts.map(account => [account._id, account])),
      true
    );
    setData('transactions', fromPairs(txns.map(txn => [txn._id, txn])), true);

    const onPouchEvent = myDebounce(
      async args => {
        store.update($store => {
          args.forEach(({ id, doc, deleted }) => {
            debug('Saw a DB change for %s', id);
            const transactionType = doc.type;
            // We had a period where transaction IDs didn't have 'transaction/'
            // prepended, so we can't detect them by looking for that
            const storeKey =
              transactionType === 'account' || transactionType === 'category' || transactionType === 'envelope'
                ? 'accounts'
                : doc.type === 'envelopeTransfer' ||
                  doc.type === 'accountTransfer' ||
                  doc.type === 'banktxn' ||
                  doc.type === 'fill'
                ? 'transactions'
                : null;
            if (!storeKey) return;
            if (deleted) {
              debug('Doc was deleted');
              delete $store[storeKey][id];
            } else {
              debug('Received an update for %s %s: %O', storeKey, id, doc);
              $store[storeKey][id] = doc;
            }
          });
          return $store;
        });

        balancesStore.set(immer(await loadBalances(graphql.localDB), identity));
      },
      500
    );

    debug('Registering pouchdb changes listener');
    graphql.localDB
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', onPouchEvent)
      .on('error', console.error);
  } else {
    debug('Reading data from Hasura');
    const [accounts, transactions] = await Promise.all([
      getIdb('accounts'),
      getIdb('transactions'),
    ]);
    debug(
      'Setting data from IndexedDB: %s, %s',
      Object.values(accounts || {}).length,
      Object.values(transactions || {}).length
    );
    if (accounts) setData('accounts', accounts, true);
    if (transactions) setData('transactions', transactions, true);

    Accounts.subscribe(graphql, async ({ data }) => {
      setData(
        'accounts',
        fromPairs(data.accounts.map(account => [account.id, account]))
      );
      await setIdb('accounts', pendingData.accounts);
    });
    Transactions.subscribe(graphql, async ({ data }) => {
      setData(
        'transactions',
        fromPairs(data.transactions.map(txn => [txn.id, txn]))
      );
      await setIdb('transactions', pendingData.transactions);
    });
  }
}

export const pouchStore = writable(
  immer({ state: 'offline', stateDetail: null }, identity)
);

export const balancesStore = writable(
  immer({}, identity)
);

window.store = store;
window.derivedStore = arrays;
window.balancesStore = balancesStore;
