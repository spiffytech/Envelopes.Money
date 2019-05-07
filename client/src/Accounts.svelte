<script>
  import {Base64} from 'js-base64';
  import localforage from 'localforage';
  import flatten from 'lodash/flatten';
  import groupBy from 'lodash/groupBy';
  import {onMount} from 'svelte';

  import Balance from './Balance.svelte';
  import * as Balances from './lib/Balances';
  import {toDollars} from './lib/pennies';
  import {guardCreds} from './lib/utils';

  const creds = guardCreds();

  let balances = [];

  // Default for if the user hasn't selected a fill interval yet.
  let interval = localStorage.getItem('fillInterval') || 'monthly';

  $: envelopes = groupBy(balances, (balance) => balance.type)['envelope'] || [];
  $: accounts = groupBy(balances, (balance) => balance.type)['account'] || [];

  let selectedTag = null;

  $: envelopesByTag = groupBy(
    envelopes.filter(Balances.isBalanceEnvelope),
    (envelope) => selectedTag ? envelope.tags[selectedTag] || '' : null
  );

  $: allTags = Array.from(new Set(flatten(
    envelopes.
      filter(Balances.isBalanceEnvelope).
      map((envelope) => Object.keys(envelope.tags))
  ))).sort((a, b) => !a ? 1 : a < b ? -1 : 1);
  
  let balancesP = new Promise(() => null);
  
  onMount(() => {
    balancesP = (async () => {
      const {data} = await Balances.loadBalances(creds);
      balances = data.balances;

      selectedTag = await localforage.getItem('selectedTag');
    })();
  });
</script>

<div>
  <div>
    <header class="font-bold text-base lg:textt-lg">Accounts</header>
    {#each accounts as account}
      <a
        href={`./editAccount/${Base64.encode(account.id)}`}
        class="flex justify-between p-3 border rounded border-grey-light no-underline text-black"
      >
        <Balance balance={account} interval={interval} />
      </a>
    {/each}
  </div>

  <select bind:value={selectedTag}>
    <option value={null}>Select a tag</option>
    {#each allTags as tag}
      <option value={tag}>{tag}</option>
    {/each}
  </select>

  <div>
    <header class="font-bold text-base lg:text-lg">Envelopes</header>
    {#each Object.entries(envelopesByTag) as [tagValue, envelopes]}
      <div>
        <header>
          {tagValue === 'null' ? 'No Value' : tagValue}: &nbsp;
          {toDollars(envelopes.map((envelope) => envelope.balance).reduce((acc, item) => acc + item, 0))} / &nbsp;
          {toDollars(envelopes.map((envelope) => Balances.calcAmountForPeriod(envelope)[interval]).reduce((acc, item) => acc + item, 0))}
        </header>

        {#each envelopes as envelope}
          <a
            href={`/editAccount/${Base64.encode(envelope.id)}`}
            class="flex justify-between p-3 border rounded border-grey-light no-underline text-black"
          >
            <Balance balance={envelope} interval={interval} />
          </a>
        {/each}
      </div>
    {/each}
  </div>
</div>