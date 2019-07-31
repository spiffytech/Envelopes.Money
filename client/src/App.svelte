<script>
  import Debug from 'debug';
  import immer from 'immer';
  import page from 'page';
  import { setContext } from 'svelte';

  import { endpoint } from './lib/config';
  import EditAccount from './EditAccount.svelte';
  import EditTags from './EditTags.svelte';
  import EditTxn from './EditTxn.svelte';
  import FillEnvelopes from './FillEnvelopes.svelte';
  import Home from './Home.svelte';
  import Nav from './components/Nav.svelte';
  import loadBalances from './lib/loadBalances';
  import * as mainStore from './stores/main';
  import { store, balancesStore } from './stores/main';
  import { arrays as derivedStore, pouchStore } from './stores/main';
  import Login from './Login.svelte';
  import { mkClient as mkWSClient } from './lib/graphql';
  import initPouch from './lib/pouch';
  import { initRemote, logIn, sync } from './lib/pouch';
  import * as libPouch from './lib/pouch';

  export let creds;

  const debug = Debug('Envelopes.Money:App.svelte');

  let route;
  let routeParams;

  setContext('endpoint', endpoint);

  function setRoute(r) {
    return function({ params }) {
      route = r;
      routeParams = params;
    };
  }

  if (creds || window._env_.POUCH_ONLY) {
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

    let wsclient;
    if (!window._env_.POUCH_ONLY) {
      wsclient = mkWSClient(window._env_.GRAPHQL_WSS_HOST, {
        reconnect: true,
        connectionParams: {
          headers: {
            Authorization: `Bearer ${creds.apikey}`,
          },
        },
      });
      wsclient.client.onConnecting(() =>
        store.update($store => ({ ...$store, connecting: true }))
      );
      wsclient.client.onConnected(() =>
        store.update($store => ({
          ...$store,
          connecting: false,
          connected: true,
        }))
      );
      wsclient.client.onReconnecting(() =>
        store.update($store => ({ ...$store, connecting: true }))
      );
      wsclient.client.onReconnected(() =>
        store.update($store => ({
          ...$store,
          connecting: false,
          connected: true,
        }))
      );
      wsclient.client.onDisconnected(() =>
        store.update($store => ({ ...$store, connected: false }))
      );
    }

    let localDB;
    if (window._env_.USE_POUCH) {
      localDB = initPouch();
      const pouchAccounts = new libPouch.PouchAccounts(localDB);
      pouchAccounts.initializeSystemAccounts().then(async () => {
        if (creds) initRemote(creds, localDB, pouchStore);
        balancesStore.set(await loadBalances(localDB));
      });
    }
    const graphql = {
      wsclient,
      pouch: localDB,
      localDB,
      userId: window._env_.POUCH_ONLY ? null : creds.userId,
      apikey: window._env_.POUCH_ONLY ? null : creds.apikey,
    };
    setContext('graphql', graphql);
    setContext('creds', graphql);
    setContext('balancesStore', balancesStore);
    setContext('localDB', localDB);
    if (window.Cypress) {
      window.creds = creds;
      window.graphql = graphql;
      window.libPouch = libPouch;
    }
    window.localDB = localDB;

    mainStore.subscribe(graphql);
  } else {
    page('/login', setRoute(Login));
    page('*', setRoute(Login));
    page({ hashbang: true });

    debug('Paging to /login');
    page('/login');
  }
</script>

{#if window.Cypress}
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

{#if window._env_.POUCH_ONLY || (creds && creds.email && creds.password)}
  {#if $store.connecting}
    <p>🏃 Connecting to the database...</p>
  {:else if (window._env_.USE_POUCH || $store.connected) && $derivedStore.isLoading}
    {#if window._env_.USE_POUCH}
      <p>Loading data from local store...</p>
    {:else}
      <p>✔️ Connected</p>
      <p>Loading data...</p>
    {/if}
    {#each Object.entries($derivedStore.loadedItems) as [itemName, isLoaded]}
      <span>{isLoaded ? '✔️' : '🏃'} {itemName}</span>
    {/each}
  {:else if !$store.connected && !window._env_.USE_POUCH}
    <p>We're not connected or even trying to connect! but why!</p>
  {/if}

  <Nav />

  <main>
    {#if (window._env_.USE_POUCH || $store.connected) && !$derivedStore.isLoading}
      <svelte:component this={route} bind:params={routeParams} />
    {/if}
  </main>
{:else}
  <p>Not logged in</p>
  <main>
    <svelte:component this={route} bind:params={routeParams} />
  </main>
{/if}
