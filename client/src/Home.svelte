<script>
  import debounce from 'lodash/debounce';
  import page from 'page';

  import Accounts from './Accounts.svelte';
  import Transaction from './components/Transaction.svelte';
  import { toDollars } from './lib/pennies';
  import { arrays as derivedStore, store } from './stores/main';

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
    const dataStr = JSON.stringify(Object.values($store.transactions, null, 4));
    triggerDownload(dataStr);
  }
</script>

<button class="btn btn-tertiary" on:click|preventDefault={exportTxns}>Export Transactions</button>
<Accounts />
