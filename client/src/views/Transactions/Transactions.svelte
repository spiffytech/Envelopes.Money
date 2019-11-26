<script>
  import Debug from 'debug';
  import { getContext } from 'svelte';

  import Icon from '../../components/Icon.svelte';
  import Transaction from './Transaction.svelte';

  import * as libtxngroup from '../../lib/transactionGroup';

  const debug = Debug('Envelopes.Money:Transactions.svelte');

  const txnGroupStore = getContext('txnGroupStore');

  $: txnsGroupsToShow = $txnGroupStore.filter(libtxngroup.filter({account: null, envelope: null, term: ''}));

  $: debug('%d transactions to show', txnsGroupsToShow.length);
</script>

<section class="m-auto max-w-3xl">
  <div class="flex mb-3">
    <div class="p-2 mr-3">
      <a href="/editTxn">
        <Icon prefix="fas" icon="plus" />
      </a>
    </div>

    <input
      class="border w-full"
      placeholder="Search by payee, date, amount, memo" />

  </div>

  {#each txnsGroupsToShow as txn}
    <div class="mb-3">
      <Transaction {txn} />
    </div>
  {/each}
</section>
