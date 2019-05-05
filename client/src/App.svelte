<script>
	import checkOnline from 'is-online';
	import {getContext, setContext} from 'svelte';

  import {endpoint} from './lib/config';
	import EditAccount from './EditAccount.svelte'
	import EditTags from './EditTags.svelte';
  import EditTxn from './EditTxn.svelte';
	import FillEnvelopes from './FillEnvelopes.svelte';
	import Home from './Home.svelte';
	import Login from './Login.svelte';
  let route;
  let routeParams;
	import page from 'page';

	setContext('endpoint', endpoint)
	setContext('creds', JSON.parse(localStorage.getItem('creds')));
  const creds = getContext('creds');
  
  function setRoute(r) {
    return function({params}) {
      route = r;
      routeParams = params;
    }
  }

	page('/', () => route = Home);
	page('/home', () => route = Home);
	page('/login', () => route = Login);
	page('/fill', () => route = FillEnvelopes);
	page('/editTags', setRoute(EditTags));
	page('/editTxn', setRoute(EditTxn));
	page('/editTxn/:txnId', setRoute(EditTxn));
	page('/editAccount', setRoute(EditAccount));
  page('/editAccount/:accountId', setRoute(EditAccount));
  page({hashbang: true});

	let onlineStatus = undefined;

	async function watchOnlineStatus() {
      onlineStatus = await checkOnline();

	  const timeout = onlineStatus ? 5000 : 500;
      await new Promise((resolve) => setTimeout(resolve, timeout));
      watchOnlineStatus();
    }
    watchOnlineStatus();

	if (!creds) page('/login');
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
