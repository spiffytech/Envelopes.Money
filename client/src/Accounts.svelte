<script>
  import chain from 'ramda/es/chain';
  import fromPairs from 'ramda/es/fromPairs';
  import groupBy from 'ramda/es/groupBy';
  import uniq from 'ramda/es/uniq';
  import { onMount } from "svelte";

  import Balance from "./Balance.svelte";
  import { toDollars } from "./lib/pennies";
  import { formatDate } from "./lib/utils";
  import { arrays as derivedStore} from "./stores/main";

  $: sortFns = {
    name: (a, b) => (a.name < b.name ? -1 : 1),
    balance: (a, b) => {
      const currentDateStr = formatDate(new Date());
      return $derivedStore.balancesByAccountByDay[a.id].balances[currentDateStr] < $derivedStore.balancesByAccountByDay[b.id].balances[currentDateStr] ? 1 : -1;
    }
  };

  // Default for if the user hasn't selected a fill interval yet.
  let interval = localStorage.getItem("fillInterval") || "monthly";

  let showAccounts = false;
  let sortBy = "name";
  $: sortFn = sortFns[sortBy];
  let sortTag = null;
  $: localStorage.setItem('selectedTag', sortTag);
  $: accounts = $derivedStore.accounts.slice().sort(sortFn);
  $: envelopes = $derivedStore.envelopes.slice().sort(sortFn);
  $: allTags = uniq(
    chain(
      envelope => Object.keys(envelope.tags),
      envelopes
    ).sort()
  );

  $: envelopesByTag = groupBy(
    envelope => (sortTag ? envelope.tags[sortTag] : ""),
    envelopes
  );

  $: envelopeTagValues = Object.keys(envelopesByTag).sort();

  $: totalBalancesByTag = fromPairs(
    Object.entries(envelopesByTag).map(([tag, envelopeBalancesForTag]) => {
      const currentDateStr = formatDate(new Date());
      return [
        tag,
        envelopeBalancesForTag
          .map(({ id }) => {
            if ($derivedStore.balancesByAccountByDay[id]) {
              return $derivedStore.balancesByAccountByDay[id].balances[currentDateStr]
            }
            return 0;
          })
          .reduce(
            (tagBalance, envelopeBalance) => tagBalance + envelopeBalance,
            0
          )
      ];
    })
  );

  onMount(() => {
    (async () => {
      sortTag = await localStorage.getItem("selectedTag");
    })();
  });
</script>

<div class="m-3">
  <div class="shadow-md p-3 rounded-lg mb-3 b-white max-w-sm">
    <label>
      Sort By:
      <select on:change={event => (sortBy = event.target.value)}>
        <option value="name">Name</option>
        <option value="balance">Balance</option>
      </select>
    </label>
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
      {#each accounts as account}
        <a
          href={`/editAccount/${encodeURIComponent(encodeURIComponent(account.id))}`}
          style="display: contents; color: inherit; text-decoration: inherit;">
          <Balance balance={$derivedStore.balancesByAccountByDay[account.id]} defaultDaysToRender={15} />
        </a>
      {/each}
    </div>
  {/if}

  <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
    <header class="font-bold text-lg small-caps cursor-pointer">
      Envelopes
    </header>
    <label>
      Group by:
      <select on:change={event => (sortTag = event.target.value)}>
        <option value={'null'}>No Tag</option>
        {#each allTags as tag}
          <option value={tag}> {tag} </option>
        {/each}
      </select>
    </label>
  </div>
  {#each envelopeTagValues as tagValue}
    <div data-cy={`envelope-group-${tagValue || 'null'}`}>
      <header class="small-caps">
         {sortTag === 'null' ? 'No tag selected' : sortTag}:
        <span class="font-bold small-caps">
           {tagValue === 'undefined' ? 'No Value' : tagValue}
        </span>
      </header>
      <div data-cy='total-balance'>Total balance: {toDollars(totalBalancesByTag[tagValue])}</div>
      <div class="flex flex-wrap -m-3">
        {#each envelopesByTag[tagValue] as envelope}
          <a
            href={`/editAccount/${encodeURIComponent(encodeURIComponent(envelope.id))}`}
            style="display: contents; color: inherit; text-decoration: inherit;"
            data-cy="envelope"
            data-account-name={envelope.name}>
            <Balance balance={$derivedStore.balancesByAccountByDay[envelope.id]} defaultDaysToRender={15} />
          </a>
        {/each}
      </div>
    </div>
  {/each}
</div>
