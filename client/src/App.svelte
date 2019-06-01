<script>
	import checkOnline from 'is-online';
	import page from 'page';
	import {getContext, setContext} from 'svelte';

  import {endpoint} from './lib/config';
	import EditAccount from './EditAccount.svelte'
	import EditTags from './EditTags.svelte';
  import EditTxn from './EditTxn.svelte';
	import FillEnvelopes from './FillEnvelopes.svelte';
	import Home from './Home.svelte';
	import Login from './Login.svelte';
	import mkApollo from './lib/apollo';
  let route;
  let routeParams;

  function setRoute(r) {
    return function({params}) {
      route = r;
      routeParams = params;
    }
  }

	page('/', setRoute(Home));
	page('/home', setRoute(Home));
	page('/login', setRoute(Login));
	page('/fill', setRoute(FillEnvelopes));
	page('/editTags', setRoute(EditTags));
	page('/editTxn', setRoute(EditTxn));
	page('/editTxn/:txnId', setRoute(EditTxn));
	page('/editAccount', setRoute(EditAccount));
  page('/editAccount/:accountId', setRoute(EditAccount));
	page({hashbang: true});

	setContext('endpoint', endpoint)
	const creds = JSON.parse(localStorage.getItem('creds'));
	if (!creds) {
		page('/login');
	} else {
		setContext('creds', creds);
		const graphql = {apollo: mkApollo(creds.apikey), userId: creds.userId, apikey: creds.apikey};
		setContext('graphql', graphql);
		if (window.Cypress) {
			window.graphql = graphql;
		}
	}

	let onlineStatus = undefined;

	async function watchOnlineStatus() {
      onlineStatus = await checkOnline();

	  const timeout = onlineStatus ? 5000 : 500;
      await new Promise((resolve) => setTimeout(resolve, timeout));
      watchOnlineStatus();
    }
    watchOnlineStatus();
</script>

{#if onlineStatus || onlineStatus === undefined}
  <div class='stripe bg-orange h-1'></div>
	<div class="bg-white border border-grey-light rounded flex justify-between flex-wrap nav mb-2">
		<a class="btn font-bold" href="/home">HackerBudget</a>
		<div>
			<a class="btn btn-primary" href="/editTxn">New Transaction</a>
			<a class="btn btn-secondary" href="/editAccount">New Account</a>
			<a class="btn btn-secondary" href="/fill">Fill Envelopes</a>
			<a class="btn btn-secondary" href="/editTags">Edit Tags</a>
		</div>
	</div>
	<svelte:component this={route} bind:params={routeParams} />
{:else}
	<p>Please go online to use the app</p>
{/if}
