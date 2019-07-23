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
  import { arrays as derivedStore } from "./stores/main";
  import Login from "./Login.svelte";
  import {mkClient as mkWSClient} from './lib/graphql';

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
  if (!creds) {
    page("/login");
  } else {
    const graphql = {
      wsclient: mkWSClient(
        window._env_.GRAPHQL_WSS_HOST,
        {
            reconnect: true,
            connectionParams: {
              headers: {
                'Authorization': `Bearer ${creds.apikey}`,
              }
            },
          }
      ),
      userId: creds.userId,
      apikey: creds.apikey
    };
    setContext("graphql", graphql);
    setContext("creds", graphql);
    if (window.Cypress) {
      window.creds = creds;
      window.graphql = graphql;
    }

    graphql.wsclient.client.onConnecting(() =>
      store.update($store => ({...$store, connecting: true}))
    )
    graphql.wsclient.client.onConnected(() =>
      store.update($store => ({...$store, connecting: false, connected: true}))
    )
    graphql.wsclient.client.onReconnecting(() =>
      store.update($store => ({...$store, connecting: true}))
    )
    graphql.wsclient.client.onReconnected(() =>
      store.update($store => ({...$store, connecting: false, connected: true}))
    )
    graphql.wsclient.client.onDisconnected(() =>
      store.update($store => ({...$store, connected: false}))
    )
    mainStore.subscribe(graphql);
  }
</script>

{#if window.Cypress} 
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

{#if creds}
  {#if $store.connecting}
    <p>🏃 Connecting to the database...</p>
  {:else if $store.connected && $derivedStore.isLoading}
    <p>✔️ Connected</p>
    <p>Loading data...</p>
    {#each Object.entries($derivedStore.loadedItems) as [itemName, isLoaded]}
      <span>{isLoaded ? '✔️' : '🏃'} {itemName}</span>
    {/each}
  {:else if !$store.connected}
    <p>We're not connected or even trying to connect! but why!</p>
  {/if}

  <Nav />

  <svelte:component this={route} bind:params={routeParams} />
{:else}
  <p>Not logged in</p>
  <svelte:component this={route} bind:params={routeParams} />
{/if}
