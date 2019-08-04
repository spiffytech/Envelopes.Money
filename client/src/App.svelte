<script>
  import comparator from 'ramda/es/comparator';
  import Debug from 'debug';
  import identity from 'ramda/es/identity';
  import immer from 'immer';
  import Kinto from 'kinto';
  import page from 'page';
  import { setContext } from 'svelte';
  import shortid from 'shortid';

  import { endpoint } from './lib/config';
  import EditAccount from './EditAccount.svelte';
  import EditTags from './EditTags.svelte';
  import EditTxn from './EditTxn.svelte';
  import FillEnvelopes from './FillEnvelopes.svelte';
  import Home from './Home.svelte';
  import Nav from './components/Nav.svelte';
  import {
    accountsStore,
    balancesStore,
    pouchStore,
    transactionsStore,
  } from './stores/main';
  import Login from './Login.svelte';
  import { mkClient as mkWSClient } from './lib/graphql';
  import initPouch from './lib/pouch';
  import { initRemote, logIn, sync } from './lib/pouch';
  import * as libPouch from './lib/pouch';

  const debug = Debug('Envelopes.Money:App.svelte');

  let route;
  let routeParams;


  setContext('endpoint', endpoint);
  setContext('balancesStore', balancesStore);
  setContext('accountsStore', accountsStore);
  setContext('transactionsStore', transactionsStore);

  function setRoute(r) {
    return function({ params }) {
      route = r;
      routeParams = params;
    };
  }

  let storeIsLoaded = false;

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

  const kinto = new Kinto();
  const transactionsColl = kinto.collection('transactions', {
    idSchema: {
      generate(doc) {
        return `transaction/${shortid.generate()}`;
      },

      validate(id) {
        return id.match(/^transaction\/.*/);
      },
    }
  });
  const accountsColl = kinto.collection('accounts', {
    idSchema: {
      generate(doc) {
        if (doc.type_ === 'envelope' || doc.type_ === 'category') {
          return `envelope/${shortid.generate()}`;
        }
        return `account/${shortid.generate()}`;
      },

      validate(id) {
        return id.match(/^(envelope|account|category)\/.*/);
      },
    },
  });

  window.transactionsColl = transactionsColl;
  window.accountsColl = accountsColl;

  setContext('kinto', {accountsColl, transactionsColl});

  async function loadStore() {
    debug('Loading data from Kinto');
    const [{data: accounts}, {data: transactions}] = await Promise.all([
      accountsColl.list(),
      transactionsColl.list()
    ]);

    accountsStore.set(immer(accounts, identity));
    transactionsStore.set(immer(transactions.sort(comparator((a, b) => a.date > b.date)), identity));
    debug('Data loaded');
    storeIsLoaded = true;
  }

  loadStore();

  if (window.Cypress) {
    window.graphql = graphql;
  }
</script>

{#if window.Cypress}
  <p>{JSON.stringify(window.Cypress.env())}</p>
{/if}

<Nav />

<main>
  {#if storeIsLoaded}
    <svelte:component this={route} bind:params={routeParams} />
  {/if}
</main>
