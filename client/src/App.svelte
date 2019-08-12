<script>
  import axios from 'axios';
  import comparator from 'ramda/es/comparator';
  import Debug from 'debug';
  import Dexie from 'dexie';
  import EventEmitter from 'eventemitter3';
  import identity from 'ramda/es/identity';
  import immer from 'immer';
  import page from 'page';
  import { setContext } from 'svelte';
  import { get as storeGet } from 'svelte/store';
  import shortid from 'shortid';

  import { mkClient as mkWSClient } from './lib/graphql';
  import getTransactions from './lib/transactions/getTransactions';
  import saveTransactionsRemote from './lib/transactions/saveTransactionsRemote';
  import deleteTransactionsRemote from './lib/transactions/deleteTransactionsRemote';
  import subscribeTransactions from './lib/transactions/subscribe';
  import getAccounts from './lib/accounts/getAccountsRemote';
  import saveAccounts from './lib/accounts/saveAccountsRemote';
  import subscribeAccounts from './lib/accounts/subscribe';
  import sync from './lib/sync';

  import EditAccount from './EditAccount.svelte';
  import EditTags from './EditTags.svelte';
  import EditTxn from './EditTxn.svelte';
  import FillEnvelopes from './FillEnvelopes.svelte';
  import Home from './Home.svelte';
  import PageHeader from './components/PageHeader.svelte';
  import Nav from './components/Nav.svelte';
  import Login from './Login.svelte';
  import {
    accountsStore,
    balancesStore,
    transactionsStore,
    connectionStore,
    credsStore,
    wsclientStore,
    syncStore,
    navStore,
    intervalStore,
  } from './stores/main';
  import { endpoint } from './lib/config';

  const debug = Debug('Envelopes.Money:App.svelte');

  function setRoute(r) {
    return function({ params }) {
      route = r;
      routeParams = params;
    };
  }

  function initWsclient(creds) {
    debug('Creating the wsclient');
    const wssUri = window._env_.GRAPHQL_WSS_HOST;
    if (!wssUri) throw new Error('Missing WSS GraphQL endpoint');
    const wsclient = mkWSClient(wssUri, {
      reconnect: true,
      connectionParams: {
        headers: {
          Authorization: `Bearer ${creds.apikey}`,
        },
      },
    });
    wsclient.client.onConnecting(() => connectionStore.set('connecting'));
    wsclient.client.onConnected(() => connectionStore.set('connected'));
    wsclient.client.onReconnecting(() => connectionStore.set('connecting'));
    wsclient.client.onReconnected(() => connectionStore.set('connected'));
    wsclient.client.onDisconnected(() => connectionStore.set('disconnected'));

    wsclientStore.set(wsclient);

    debug('Subscribing to transactions and accounts');
    subscribeTransactions(
      wsclient,
      creds.userId,
      ({ data: { transactions } }) =>
        syncTransactions(creds, wsclient, transactions)
    );
    subscribeAccounts(wsclient, creds.userId, ({ data: { accounts } }) =>
      syncAccounts(creds, wsclient, accounts)
    );
  }

  async function syncTransactions(creds, wsclient, transactions = null) {
    debug('Syncing transactions');
    syncStore.set('syncing');
    await sync(
      {
        get: () => transactions || getTransactions(wsclient, creds.userId),
        store: records => saveTransactionsRemote(wsclient, records),
        delete: ids => deleteTransactionsRemote(wsclient, ids),
      },
      {
        get: () => dexie.transactions.toArray(),
        store: records => dexie.transactions.bulkPut(records),
        delete: ids => dexie.transactions.bulkDelete(ids),
      },
      {
        get: () => dexie.transactionsStatus.toArray(),
        store: records => dexie.transactionsStatus.bulkPut(records),
        delete: ids => dexie.transactionsStatus.bulkDelete(ids),
      }
    );
    syncStore.set(null);
    debug('Transactions sync complete');
    if (true) loadStore();
  }

  async function syncAccounts(creds, wsclient, accounts) {
    debug('Syncing accounts');
    await sync(
      {
        get: () => accounts || getAccounts(wsclient, creds.userId),
        store: records => saveAccounts(wsclient, records),
        delete: ids => {
          throw new Error(`We should never be deleting accounts. ${ids}`);
        },
      },
      {
        get: () => dexie.accounts.toArray(),
        store: records => dexie.accounts.bulkPut(records),
        delete: ids => dexie.accounts.bulkDelete(ids),
      },
      {
        get: () => dexie.accountsStatus.toArray(),
        store: records => dexie.accountsStatus.bulkPut(records),
        delete: ids => dexie.accountsStatus.bulkDelete(ids),
      }
    );

    syncStore.set(null);
    debug('Accounts sync complete');

    // TODO: if (dirty)
    if (true) loadStore();
  }

  async function loadStore() {
    debug('Loading data from Dexie');
    const [accounts, transactions] = await Promise.all([
      dexie.accounts.toArray(),
      dexie.transactions.toArray(),
    ]);
    accountsStore.set(
      immer(accounts.sort(comparator((a, b) => a.name < b.name)), identity)
    );
    transactionsStore.set(
      immer(transactions.sort(comparator((a, b) => a.date > b.date)), identity)
    );

    storeIsLoaded = true;
    debug('Loaded data!');
  }

  async function loadCreds() {
    try {
      debug('Loading credentials');
      const response = await axios.get(`${endpoint}/api/credentials`, {
        withCredentials: true,
      });
      debug('Loaded credentials were %o', response.data);
      credsStore.set({ ...($credsStore || {}), ...response.data });
    } catch (ex) {
      if (ex.response && ex.response.status === 401) {
        debug('No credentials were loaded');
        credsStore.set(null);
      } else {
        throw new Error(`[loadCreds] ${ex.message}`);
      }
    }
  }

  let route;
  let routeParams;
  let storeIsLoaded = false;
  const activityEmitter = new EventEmitter();

  const dexie = new Dexie('Envelopes.Money');
  dexie.version(1).stores({
    accounts: '&id, name, type',
    transactions:
      '&id, date, amount, label, txn_id, from_id, to_id, memo, type, cleared',
    test: '&id, date, amount, label',
  });
  dexie.version(2).stores({
    accountsStatus: '&id, sha256',
    transactionsStatus: '&id, sha256',
  });
  window.dexie = dexie;

  $: if (!storeIsLoaded) loadStore();
  $: if ($credsStore === null) loadCreds();
  $: if ($credsStore !== null && $wsclientStore === null) {
    initWsclient($credsStore);
  }
  activityEmitter.on('accountsChanged', () => {
    if (storeGet(connectionStore) === 'connected') {
      syncAccounts($credsStore, $wsclientStore);
    }
  });
  activityEmitter.on('transactionsChanged', () => {
    if (storeGet(connectionStore) === 'connected') {
      syncTransactions($credsStore, $wsclientStore);
    }
  });

  setContext('endpoint', endpoint);
  setContext('balancesStore', balancesStore);
  setContext('accountsStore', accountsStore);
  setContext('transactionsStore', transactionsStore);
  setContext('credsStore', credsStore);
  setContext('dexie', dexie);
  setContext('syncStore', syncStore);
  setContext('navStore', navStore);
  setContext('intervalStore', intervalStore);
  setContext('activityEmitter', activityEmitter);

  page('/', setRoute(Home));
  page('/home', setRoute(Home));
  page('/login', setRoute(Login));
  page('/fill', setRoute(FillEnvelopes));
  page('/editTags', setRoute(EditTags));
  page('/editTxn', setRoute(EditTxn));
  page('/editTxn/:txnId', setRoute(EditTxn));
  page('/editAccount', setRoute(EditAccount));
  page('/editAccount/:accountId', setRoute(EditAccount));
  page({ hashbang: true });
</script>

{#if window.Cypress}
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

{#if $connectionStore !== 'connected'}
  <p>{$connectionStore}</p>
{/if}

<PageHeader />

<Nav />

<main aria-label="Page Content" class="flex-1" style="transition: all 0.3s">
  {#if storeIsLoaded}
    <svelte:component this={route} bind:params={routeParams} />
  {:else}Loading data...{/if}
</main>
