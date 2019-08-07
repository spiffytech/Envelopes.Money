<script>
  import { getContext } from 'svelte';

  import { toDollars } from '../lib/pennies';

  export let txn;

  const accountsStore = getContext('accountsStore');

  const fromName = $accountsStore.find(account => account.id === txn.from_id)
    .name;
  const toNames = $accountsStore
    .filter(account =>
      Array.isArray(txn.to_ids)
        ? txn.to_ids.indexOf(account.id) !== -1
        : account.id === txn.to_id
    )
    .map(t => t.name);
</script>

<a
  style="display: contents"
  href={`/editTxn/${encodeURIComponent(encodeURIComponent(txn.txn_id))}`}>
  <div
    class="flex justify-between p-3 border border-gray-400 rounded mb-1"
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
        <span class="whitespace-no-wrap">{fromName}</span>
        &nbsp;→&nbsp;
        <span
          style="text-overflow: ellipsis"
          class="whitespace-no-wrap overflow-hidden">
          {toNames.join(', ')}
        </span>
      </div>
    </div>

    <div class="text-right">{toDollars(txn.amount)}</div>

    <div
      class="ml-2 border-2 rounded text-xl flex item-center justify-between p-1"
      class:bg-green-100={txn.cleared}
      class:border-green-600={txn.cleared}
      title={'Cleared? ' + txn.cleared}>
      <div>C</div>
    </div>
  </div>
</a>
