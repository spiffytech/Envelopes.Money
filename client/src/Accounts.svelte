<script>
  import localforage from "localforage";
  import flatten from "lodash/flatten";
  import groupBy from "lodash/groupBy";
  import * as R from "ramda";
  import { onMount } from "svelte";

  import Balance from "./Balance.svelte";
  import * as Balances from "./lib/Balances";
  import { toDollars } from "./lib/pennies";
  import { formatDate } from "./lib/utils";
  import { arrays as derivedStore, store } from "./stores/main";

  const sortFns = {
    name: (a, b) => (a.account.name < b.account.name ? -1 : 1),
    balance: (a, b) => {
      const currentDateStr = formatDate(new Date());
      return a.balances[currentDateStr] < b.balances[currentDateStr] ? -1 : 1;
    }
  };

  // Default for if the user hasn't selected a fill interval yet.
  let interval = localStorage.getItem("fillInterval") || "monthly";

  let showAccounts = false;
  let sortBy = "name";
  $: sortFn = sortFns[sortBy];
  let sortTag = null;
  $: accountBalances = $derivedStore.accountBalances.slice().sort(sortFn);
  $: envelopeBalances = $derivedStore.envelopeBalances.slice().sort(sortFn);
  $: allTags = R.uniq(
    R.chain(
      envelope => Object.keys(envelope.account.tags),
      envelopeBalances
    ).sort()
  );

  $: envelopesByTag = R.groupBy(
    envelope => (sortTag ? envelope.account.tags[sortTag] : ""),
    envelopeBalances
  );

  $: envelopeTagValues = Object.keys(envelopesByTag).sort();

  $: totalBalancesByTag = R.fromPairs(
    Object.entries(envelopesByTag).map(([tag, envelopeBalancesForTag]) => {
      const currentDateStr = formatDate(new Date());
      return [
        tag,
        envelopeBalancesForTag
          .map(({ balances }) => balances[currentDateStr])
          .reduce(
            (tagBalance, envelopeBalance) => tagBalance + envelopeBalance,
            0
          )
      ];
    })
  );

  $: envelopes =
    groupBy($derivedStore.balances, balance => balance.type)["envelope"] || [];
  $: accounts =
    groupBy($derivedStore.balances, balance => balance.type)["account"] || [];

  onMount(() => {
    (async () => {
      sortTag = await localforage.getItem("selectedTag");
    })();
  });
</script>

<div class="m-3">
  <div class="shadow-md p-3 rounded-lg mb-3 b-white max-w-sm">
    Sort By:
    <select on:change={event => (sortBy = event.target.value)}>
      <option value="name">Name</option>
      <option value="balance">Balance</option>
    </select>
  </div>

  <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
    <header
      class="font-bold text-lg small-caps cursor-pointer"
      on:click={() => (showAccounts = !showAccounts)}
      data-cy="show-accounts">
      <span>›</span>
      Accounts
    </header>
  </div>

  {#if showAccounts}
    <div class="flex flex-wrap -m-3">
      {#each accountBalances as balance}
        <a
          href={`/editAccount/${encodeURIComponent(encodeURIComponent(balance.account.id))}`}
          style="display: contents; color: inherit; text-decoration: inherit;">
          <Balance {balance} defaultDaysToRender={15} />
        </a>
      {/each}
    </div>
  {/if}

  <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
    <header class="font-bold text-lg small-caps cursor-pointer">
      Envelopes
    </header>
    Group by:
    <select on:change={event => (sortTag = event.target.value)}>
      <option value={'null'}>No Tag</option>
      {#each allTags as tag}
        <option value={tag}> {tag} </option>
      {/each}
    </select>
  </div>
  {#each envelopeTagValues as tagValue}
    <div>
      <header class="small-caps">
         {sortTag || 'No tag selected'}:
        <span class="font-bold small-caps">
           {tagValue === '' ? 'No Value' : tagValue}
        </span>
      </header>
      <div>Total balance: {toDollars(totalBalancesByTag[tagValue])} </div>
      <div class="flex flex-wrap -m-3">
        {#each envelopesByTag[tagValue] as balance}
          <a
            href={`/editAccount/${encodeURIComponent(encodeURIComponent(balance.account.id))}`}
            style="display: contents; color: inherit; text-decoration: inherit;">
            <Balance {balance} defaultDaysToRender={15} />
          </a>
        {/each}
      </div>
    </div>
  {/each}
</div>
