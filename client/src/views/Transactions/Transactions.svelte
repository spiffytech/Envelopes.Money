<script>
  import Debug from 'debug';
  import { getContext } from 'svelte';

  import Icon from '../../components/Icon.svelte';
  import Transaction from './Transaction.svelte';

  import * as libtxngroup from '../../lib/transactionGroup';

  const debug = Debug('Envelopes.Money:Transactions.svelte');

  const txnGroupStore = getContext('txnGroupStore');
  const accountsStore = getContext('accountsStore');

  let searchAccount = null;
  let searchEnvelope = null;
  let searchTerm = '';

  $: txnsGroupsToShow = $txnGroupStore.filter(
    libtxngroup.filter({
      account: searchAccount,
      envelope: searchEnvelope,
      term: searchTerm,
    })
  );

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
      placeholder="Search by payee, date, amount, memo"
      bind:value={searchTerm} />
  </div>

  <div class="flex justify-between mb-3">
    <select bind:value={searchAccount}>
      <option value={null}>Account</option>
      {#each $accountsStore.filter(account => account.type === 'account') as account}
        <option value={account.id}>{account.name}</option>
      {/each}
    </select>

    <select bind:value={searchEnvelope}>
      <option value={null}>Envelope</option>
      {#each $accountsStore.filter(account => account.type === 'envelope') as envelope}
        <option value={envelope.id}>{envelope.name}</option>
      {/each}
    </select>
  </div>

  {#each txnsGroupsToShow as txn}
    <div class="mb-3">
      <Transaction {txn} />
    </div>
  {/each}
</section>
