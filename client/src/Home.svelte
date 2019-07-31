<script>
  import debounce from 'lodash/debounce';
  import page from 'page';

  import Accounts from './Accounts.svelte';
  import Transaction from './components/Transaction.svelte';
  import { toDollars } from './lib/pennies';
  import { arrays as derivedStore, store } from './stores/main';

  let txnsGrouped;
  $: txnsGrouped = $derivedStore.txnsGrouped;
  const numItemsPerPage = 100;
  let pageNum = 0;

  let activeTab = 'accounts';

  function triggerDownload(data) {
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    const blob = new Blob([data], { type: 'octet/stream' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function exportTxns() {
    const dataStr = JSON.stringify(
      txnsGrouped.map(t => ({
        date: t.date,
        amount: toDollars(t.amount),
        from: t.from_name,
        to: t.to_names,
        memo: t.memo,
        type: t.type,
        label: t.label,
      }))
    );

    triggerDownload(dataStr);
  }
</script>

<button
  class="btn btn-tertiary"
  on:click={() => (activeTab = 'transactions')}
  data-cy="transactions">
  Transactions
</button>
<button
  class="btn btn-tertiary"
  on:click={() => (activeTab = 'accounts')}
  data-cy="accounts">
  Accounts
</button>
{#if activeTab === 'transactions'}
  <input
    class="border w-full"
    value={$store.searchTerm}
    on:input={debounce(
      event => store.update($s => ({ ...$s, searchTerm: event.target.value })),
      250,
      { trailing: true }
    )}
    placeholder="Search for transactions"
    data-cy="transactions-search" />

  <button
    class="btn btn-tertiary"
    on:click={exportTxns}
    type="button"
    data-cy="export-transactions">
    Export Transactions
  </button>

  {#if txnsGrouped.length === 0}
    <p data-cy="no-transactions">
      You don't have any transactions yet! Go create some by clicking the button
      in the top-right.
    </p>
  {/if}

  {#each txnsGrouped.slice(pageNum * numItemsPerPage, (pageNum + 1) * numItemsPerPage) as txn}
    <Transaction {txn} />
  {/each}

  {#each new Array(Math.ceil(txnsGrouped.length / numItemsPerPage))
    .fill(null)
    .map((_, i) => i) as btn_number}
    <button
      on:click|preventDefault={() => (pageNum = btn_number)}
      class="btn btn-secondary">
      Page {btn_number + 1}
    </button>
  {/each}
{:else}
  <Accounts />
{/if}
