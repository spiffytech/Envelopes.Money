<script>
  import {toDollars} from '../lib/pennies';

  export let txn;
</script>

<a style="display: contents" href={`/editTxn/${txn.txn_id}`} class="no-underline text-black">
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
        <span class="whitespace-no-wrap">{txn.from_name}</span>
        &nbsp;→&nbsp;
        <span
          style="text-overflow: ellipsis"
          class="whitespace-no-wrap overflow-hidden">
          {txn.to_names}
        </span>
      </div>
    </div>

    <div class="text-right">{toDollars(txn.amount)}</div>
  </div>
</a>
