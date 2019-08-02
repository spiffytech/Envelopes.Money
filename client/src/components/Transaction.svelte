<script>
  import { getContext } from 'svelte';

  import { toDollars } from "../lib/pennies";

  export let txn;

  const localDB = getContext('localDB');

  async function loadAccountNames(txn) {
    const fromP = localDB.get(txn.from_id);
    const toP = Array.isArray(txn.to_ids) ? Promise.all(txn.to_ids.map(toId => localDB.get(toId))) : Promise.all([localDB.get(txn.to_id)]);
    const [from, to] = await Promise.all([fromP, toP]);

    return {
      fromName: from.name,
      toNames: to.map(t => t.name)
    };
  }

  $: accountNamesP = loadAccountNames(txn);
</script>

<a
  style="display: contents"
  href={`/editTxn/${encodeURIComponent(encodeURIComponent(txn.txn_id))}`}
  class="no-underline text-black">
  <div
    class="flex justify-between p-3 border border-grey-light rounded mb-1"
    data-cy="transaction">
    <div class="mr-2">{txn.date}</div>
    <div class="text-left flex-1 min-w-0 mr-2">
      <div class="text-left font-bold" data-cy="transaction-label">
        {#if txn.label}
          {txn.label}
        {:else}
          <span class="italic text-sm">No Label</span>
        {/if}
        {#if txn.memo}
          <span title={txn.memo}>((Memo))</span>
        {/if}
      </div>

      <div class="flex flex-1 text-xs italic">
        {#await accountNamesP}
          <p>Loading...</p>
        {:then accountNames}
          <span class="whitespace-no-wrap">{accountNames.fromName}</span>
          &nbsp;→&nbsp;
          <span
            style="text-overflow: ellipsis"
            class="whitespace-no-wrap overflow-hidden">
            {accountNames.toNames.join(', ')}
          </span>
        {/await}
      </div>
    </div>

    <div class="text-right">{toDollars(txn.amount)}</div>

    <div
      class="ml-2 border-2 rounded text-xl flex item-center justify-between p-1"
      class:bg-green-lightest={txn.cleared}
      class:border-green-dark={txn.cleared}
      title={'Cleared? ' + txn.cleared}>
      <div>C</div>
    </div>
  </div>
</a>
