<script>
  import page from "page";
  import { setContext } from "svelte";

  import { endpoint } from "./lib/config";
  import EditAccount from "./EditAccount.svelte";
  import EditTags from "./EditTags.svelte";
  import EditTxn from "./EditTxn.svelte";
  import FillEnvelopes from "./FillEnvelopes.svelte";
  import Home from "./Home.svelte";
  import Nav from './components/Nav.svelte';
  import * as mainStore from "./stores/main";
  import {store} from './stores/main';
  import { arrays as derivedStore, pouchStore } from "./stores/main";
  import Login from "./Login.svelte";
  import {mkClient as mkWSClient} from './lib/graphql';
  import initPouch from './lib/pouch';
  import {sync} from './lib/pouch';

  export let creds;

  let route;
  let routeParams;

  function setRoute(r) {
    return function({ params }) {
      route = r;
      routeParams = params;
    };
  }

  if (creds) {
    page("/", setRoute(Home));
    page("/home", setRoute(Home));
    page("/login", setRoute(Login));
    page("/fill", setRoute(FillEnvelopes));
    page("/editTags", setRoute(EditTags));
    page("/editTxn", setRoute(EditTxn));
    page("/editTxn/:txnId", setRoute(EditTxn));
    page("/editAccount", setRoute(EditAccount));
    page("/editAccount/:accountId", setRoute(EditAccount));
    page({ hashbang: true });
  } else {
    page("/login", setRoute(Login));
    page('*', setRoute(Login));
    page({ hashbang: true });
  }

  setContext("endpoint", endpoint);
  if (!creds || !creds.email || !creds.password) {
    page("/login");
  } else {
    const wsclient = mkWSClient(
      window._env_.GRAPHQL_WSS_HOST,
      {
          reconnect: true,
          connectionParams: {
            headers: {
              'Authorization': `Bearer ${creds.apikey}`,
            }
          },
        }
    );
    wsclient.client.onConnecting(() =>
      store.update($store => ({...$store, connecting: true}))
    )
    wsclient.client.onConnected(() =>
      store.update($store => ({...$store, connecting: false, connected: true}))
    )
    wsclient.client.onReconnecting(() =>
      store.update($store => ({...$store, connecting: true}))
    )
    wsclient.client.onReconnected(() =>
      store.update($store => ({...$store, connecting: false, connected: true}))
    )
    wsclient.client.onDisconnected(() =>
      store.update($store => ({...$store, connected: false}))
    )

    let localDB
    if (window._env_.USE_POUCH) {
      localDB = initPouch(creds.email, creds.password);
      sync(localDB, pouchStore);
    }
    const graphql = {
      wsclient,
      pouch: localDB,
      localDB,
      userId: creds.userId,
      apikey: creds.apikey
    };
    setContext("graphql", graphql);
    setContext("creds", graphql);
    if (window.Cypress) {
      window.creds = creds;
      window.graphql = graphql;
    }

    mainStore.subscribe(graphql);
  }
</script>

{#if window.Cypress} 
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

{#if creds && creds.email && creds.password}
  {#if $store.connecting}
    <p>🏃 Connecting to the database...</p>
  {:else if ((window._env_.USE_POUCH || $store.connected) && $derivedStore.isLoading)}
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

  {#if (window._env_.USE_POUCH || $store.connected) && !$derivedStore.isLoading}
    <svelte:component this={route} bind:params={routeParams} />
  {/if}
{:else}
  <p>Not logged in</p>
  <svelte:component this={route} bind:params={routeParams} />
{/if}
