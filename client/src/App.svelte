<script>
  import checkOnline from "is-online";
  import page from "page";
  import { setContext } from "svelte";

  import { endpoint } from "./lib/config";
  import EditAccount from "./EditAccount.svelte";
  import EditTags from "./EditTags.svelte";
  import EditTxn from "./EditTxn.svelte";
  import FillEnvelopes from "./FillEnvelopes.svelte";
  import Home from "./Home.svelte";
  import * as mainStore from "./stores/main";
  import { arrays as derivedStore } from "./stores/main";
  import Login from "./Login.svelte";
  import mkApollo from "./lib/apollo";
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

  setContext("endpoint", endpoint);
  if (!creds) {
    page("/login");
  } else {
    setContext("creds", creds);
    const graphql = {
      apollo: mkApollo(creds.apikey),
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
    if (window.Cypress) {
      window.creds = creds;
      window.graphql = graphql;
    }

    mainStore.subscribe(graphql);
  }

  let onlineStatus = undefined;

  $: isLoading = creds && $derivedStore.isLoading;
  async function watchOnlineStatus() {
    onlineStatus = await checkOnline();

    const timeout = onlineStatus ? 5000 : 500;
    await new Promise(resolve => setTimeout(resolve, timeout));
    watchOnlineStatus();
  }
  watchOnlineStatus();
</script>

{#if window.Cypress} 
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

{#if onlineStatus || onlineStatus === undefined}
  {#if isLoading}
    <p>Loading...</p>
  {:else}
    <div class="stripe bg-orange h-1" />
    <div
      class="bg-white border border-grey-light rounded flex justify-between
      flex-wrap nav mb-2">
      <a class="btn font-bold" href="/home" data-cy='home-button'>Envelopes.Money</a>
      {#if creds}
        <div data-cy="nav-buttons">
          <a class="btn btn-primary" href="/editTxn" data-cy="new-transaction">
            New Transaction
          </a>
          <a
            class="btn btn-secondary"
            href="/editAccount"
            data-cy="new-account">
            New Account
          </a>
          <a class="btn btn-secondary" href="/fill" data-cy="fill-envelopes">
            Fill Envelopes
          </a>
          <a class="btn btn-secondary" href="/editTags" data-cy="edit-tags">
            Edit Tags
          </a>
        </div>
      {/if}
    </div>
    <svelte:component this={route} bind:params={routeParams} />
  {/if}
{:else}
  <p>Please go online to use the app</p>
{/if}
