<script>
  import fromPairs from 'lodash/fromPairs';
  import fuzzySort from 'fuzzysort';
  import groupBy from 'lodash/groupBy';
  import moment from 'moment';
  import page from 'page';
  import * as shortid from 'shortid';
  import {onMount} from 'svelte';

  import * as Balances from './lib/Balances';
  import MoneyInput from './MoneyInput.svelte';
  import {toDollars} from './lib/pennies';
  import * as TopLabels from './lib/TopLabels';
  import * as Transactions from './lib/Transactions';
  import {guardCreds} from './lib/utils';

  export let params;
  let txnId;
  $: txnId = params.txnId

  const creds = guardCreds();

  let initializeP = new Promise(() => null);

  // This takes care of while we're initializing
  let txns = [Transactions.mkEmptyTransaction(creds.userId)];
  let type = txns.map((txn) => txn.type)[0] || 'banktxn';

  // This takes care of when our props change
  onMount(async () => {
    if (!txnId) return;
    const txnP = Transactions.loadTransaction(creds, txnId);
    const {data: txns_} = await txnP;
    if (txns_.transactions.length === 0) return page('/404');
    txns = txns_.transactions;
    type = txns[0].type;
  });

  let finalTxnId;
  $: finalTxnId = txnId || shortid.generate();
  let derivedTxns;
  $: derivedTxns = txns.map((txn) => ({
    ...txn,
    date: txns[0].date,
    memo: txns[0].memo,
    from_id: txns[0].from_id,
    type,
    txn_id: finalTxnId,
  })).
  map((txn) => {
    const {__typename, ...rest} = txn;
    return rest;
  }).
  filter((txn) => txn.amount != 0);

  let allLabels = {};
  let suggestedLabels
  $: suggestedLabels =
    fuzzySort.go(txns[0].label || '', Object.keys(allLabels)).
    map((result) => result.target).
    slice(0, 5);

  let balances = [];
  let accounts;
  $: accounts = groupBy(balances, 'type');
  let from;
  $: from =
    type === 'banktxn' ? accounts['account'] :
      type === 'accountTransfer' ? accounts['account'] :
        accounts['envelope'];
  let to;
  $: to =
    type === 'banktxn' ? accounts['envelope'] :
      type === 'accountTransfer' ? accounts['account'] :
        accounts['envelope']



  onMount(() => {
    async function initialize() {
      const balancesP = Balances.loadBalances(creds);
      const labelsP = TopLabels.loadTopLabels(creds);
      const [{data: balances_}, {data: labels_}] =
        await Promise.all([balancesP, labelsP]);
      balances = balances_.balances;
      allLabels = fromPairs(labels_.top_labels.map((label) => [label.label, label]));
    }

    initializeP = initialize();
  });

  function setSuggestion(suggestion) {
    txns = txns.map((txn) => ({...txn, label: suggestion}));
    txns[0].to_id = allLabels[suggestion].to_id
    txns[0].from_id = allLabels[suggestion].from_id
  }

  let error = null;
  async function handleSubmit() {
    console.log('submitting');
    const allHaveFrom = derivedTxns.every((txn) => Boolean(txn.from_id));
    const allHaveTo = derivedTxns.every((txn) => Boolean(txn.to_id));
    if (!allHaveFrom) {
      error = "All splits must have a selected 'from'";
      return;
    }
    if (!allHaveTo) {
      error = "All splits must have a selected 'to'";
      return;
    }

    if (derivedTxns.length === 0) {
      error = 'You must have at least one non-zero split';
      return;
    }
    error = null;  // Reset it if we got here
    await Transactions.saveTransactions(creds, derivedTxns)
    page('/home');
  }

  async function deleteTransaction() {
    if (!txnId) return;
    await Transactions.deleteTransactions(creds, txnId);
    page('/home');
  }

</script>

{#await initializeP}
  <p>Loading...</p>
{:then}
  {#if from === undefined || to === undefined || from.length === 0 || to.length === 0 }
    <p data-cy=no-data>Go create some accounts and envelopes before trying to do this</p>
  {:else}
    {#if error}<p>Error! {error}</p>{/if}
    <div class="flex justify-around">
      <form
        class="content"
        on:submit|preventDefault={handleSubmit}
        data-cy='edittxn-form'
      >
        <div>
          <label class='label'>
            Transaction Type
            <select
              bind:value={type}
              class='input'
            >
              <option value="banktxn">Bank Transaction</option>
              <option value="envelopeTransfer">Envelope Transfer</option>
              <option value="accountTransfer">Account Transfer</option>
            </select>
          </label>
        </div>

        <div>
          <label class='label'>
            Who did you pay?
            <input
              bind:value={txns[0].label}
              class='input'
            />
          </label>
        </div>

        <div>
          <label class='label'>
            {#if suggestedLabels.length > 0 && (suggestedLabels.length > 1 || suggestedLabels[0] !== txns[0].label)}
              Suggested Payees:
              <div>
                {#each suggestedLabels as suggestion}
                  <div>
                    <button
                      type='button'
                      class={`input btn btn-tertiary`}
                      on:click|preventDefault={() => setSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </label>
        </div>

        <div>
          <label class='label'>
            Date
            <input
              type="date"
              value={moment(txns[0].date).toISOString(false).slice(0, 10)}
              class='input'
              on:input={(event) => txns[0].date = new Date(event.target.value)}
            />
          </label>
        </div>

        <div>
          <label class='label'>
            Memo
            <input
              bind:value={txns[0].memo}
              class='input'
            />
          </label>
        </div>

        <p class="font-bold">
          Sum of splits: {toDollars(txns.map((txn) => txn.amount || 0).reduce((acc, item) => acc + item, 0))}
        </p>

        <div>
          <label class='label'>
            {type === 'banktxn' ? 'Account:' : 'Transfer From:'}
            <select
              bind:value={txns[0].from_id}
              class='input'
            >
              <option value={null}>Select a source</option>
              {#each from as f}
                <option value={f.id}>{f.name}: {toDollars(f.balance)}</option>
              {/each}
            </select>
          </label>
        </div>

        <div>
          <label>
            {type === 'banktxn' ? 'Envelopes:' : 'Transfer Into:'}
            {#each txns as txn}
              <select bind:value={txn.to_id} class='input'>
                <option value={null}>Select a destination</option>
                {#each to as t}
                  <option value={t.id}>{t.name}: {toDollars(t.balance)}</option>
                {/each}
              </select>

              <MoneyInput
                bind:amount={txn.amount}
                defaultType="debit"
                on:change={({detail}) => txn.amount = detail}
              />
            {/each}
          </label>

          <div class='mb-3 mt-3'>
            <button
              type='button'
              class="btn btn-secondary" 
              on:click|preventDefault={() => txns = [...txns, Transactions.mkEmptyTransaction(creds.userId)]}
            >
              New Split
            </button>
          </div>
        </div>

        <div class='flex justify-between'>
          <button type="submit" class="btn btn-primary">Save Transaction</button>
          <button class="btn btn-tertiary" on:click|preventDefault={deleteTransaction}>
            Delete Transaction
          </button>
        </div>
      </form>
    </div>
  {/if}
{:catch ex}
  <p>Error! {ex.message}</p>
{/await}