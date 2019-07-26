<script>
  import fuzzySort from "fuzzysort";
  import page from "page";
  import groupBy from "ramda/es/groupBy";
  import * as shortid from "shortid";
  import { onMount } from "svelte";

  import { toDollars } from "./lib/pennies";
  import * as Transactions from "./lib/Transactions";
  import { formatDate, guardCreds } from "./lib/utils";
  import { arrays as derivedStore } from "./stores/main";
  import {PouchTransactions} from './lib/pouch';

  export let params;
  let txnId;
  $: txnId = params.txnId ? decodeURIComponent(decodeURIComponent(params.txnId)) : undefined;

  const creds = guardCreds();

  // This takes care of while we're initializing
  let txns = [Transactions.mkEmptyTransaction(creds.userId)];
  let type = txns.map(txn => txn.type)[0] || "banktxn";

  // This takes care of when our props change
  onMount(async () => {
    if (!txnId) return;
    txns = Object.values($derivedStore.transactions).filter(
      transaction => transaction.txn_id === txnId
    );
    if (txns.length === 0) return page("/404");
    type = txns[0].type;
  });

  let finalTxnId;
  $: finalTxnId = txnId || `transaction/${shortid.generate()}`;
  let derivedTxns;
  $: derivedTxns = txns
    .map(txn => ({
      ...txn,
      date: txns[0].date,
      memo: txns[0].memo,
      from_id: txns[0].from_id,
      type,
      txn_id: finalTxnId
    }))
    .map(txn => {
      const { __typename, insertion_order, _id, _rev, type_, ...rest } = txn;
      return rest;
    })
    .filter(txn => txn.amount != 0);

  $: allLabels = $derivedStore.labelQuickFills;
  let suggestedLabels;
  $: suggestedLabels = fuzzySort
    .go(txns[0].label || "", Object.keys(allLabels))
    .map(result => result.target)
    .slice(0, 5);

  const today = formatDate(new Date());
  $: balances = [
    ...Object.values($derivedStore.envelopes),
    ...Object.values($derivedStore.accounts)
  ].map(account => ({
    ...account,
    balance: $derivedStore.balancesByAccountByDay[account.id].balances[today]
  }));
  let accounts;
  $: accounts = groupBy(b => b.type, balances);
  let from;
  $: from =
    type === "banktxn"
      ? accounts["account"]
      : type === "accountTransfer"
      ? accounts["account"]
      : accounts["envelope"];
  let to;
  $: to =
    type === "banktxn"
      ? accounts["envelope"]
      : type === "accountTransfer"
      ? accounts["account"]
      : accounts["envelope"];

  function setSuggestion(suggestion) {
    txns = txns.map(txn => ({ ...txn, label: suggestion }));
    txns[0].to_id = allLabels[suggestion].to_id;
    txns[0].from_id = allLabels[suggestion].from_id;
    console.log("here", txns);
  }

  let error = null;
  async function handleSubmit() {
    const allHaveFrom = derivedTxns.every(txn => Boolean(txn.from_id));
    const allHaveTo = derivedTxns.every(txn => Boolean(txn.to_id));
    if (!allHaveFrom) {
      error = "All splits must have a selected 'from'";
      return;
    }
    if (!allHaveTo) {
      error = "All splits must have a selected 'to'";
      return;
    }

    if (derivedTxns.length === 0) {
      error = "You must have at least one non-zero split";
      return;
    }
    error = null; // Reset it if we got here
    if (!window._env_.POUCH_ONLY) {
      await Transactions.saveTransactions(creds, derivedTxns);
    }

    if (window._env_.USE_POUCH) {
      const pouchTransactions = new PouchTransactions(creds.localDB);
      pouchTransactions.saveAll(derivedTxns);
    }
    page("/home");
  }

  async function deleteTransaction() {
    if (!txnId) return;
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    if (!window._env_.POUCH_ONLY) {
      await Transactions.deleteTransactions(creds, txnId);
    }
    if (window._env_.USE_POUCH) {
      const pouchTransactions = new PouchTransactions(creds.localDB);
      await pouchTransactions.delete(txnId);
    }
    page("/home");
  }

  function filterRealAccounts(account) {
    return !account.name.match(/\[.*\]/);
  }
</script>

{#if from === undefined || to === undefined || from.filter(filterRealAccounts).length === 0 || to.filter(filterRealAccounts).length === 0}
  <p data-cy="no-data">
    Go create some accounts and envelopes before trying to do this
  </p>
{:else}
  {#if error}
    <p>Error! {error}</p>
  {/if}
  <div class="flex justify-around">
    <form
      class="content"
      on:submit|preventDefault={handleSubmit}
      data-cy="edittxn-form">
      <div>
        <label class="label">
          Transaction Type
          <select bind:value={type} class="input">
            <option value="banktxn">Bank Transaction</option>
            <option value="envelopeTransfer">Envelope Transfer</option>
            <option value="accountTransfer">Account Transfer</option>
          </select>
        </label>
      </div>

      <div>
        <label class="label">
          Who did you pay?
          <input bind:value={txns[0].label} class="input" data-cy="label" />
        </label>
      </div>

      <div>
        <label class="label">
          {#if suggestedLabels.length > 0 && (suggestedLabels.length > 1 || suggestedLabels[0] !== txns[0].label)}
            Suggested Payees:
            <div>
              {#each suggestedLabels as suggestion}
                <div data-cy="suggested-payee">
                  <button
                    type="button"
                    class={`input btn btn-tertiary`}
                    on:click|preventDefault={() => setSuggestion(suggestion)}>
                    {suggestion}
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </label>
      </div>

      <div>
        <label class="label">
          Date
          <input
            type="date"
            value={formatDate(txns[0].date)}
            class="input"
            on:input={event => (txns[0].date = formatDate(new Date(event.target.value + 'T00:00')))} />
        </label>
      </div>

      <div>
        <label class="label">
          Memo
          <input bind:value={txns[0].memo} class="input" />
        </label>
      </div>

      <div>
        <label>
          <input type="checkbox" bind:checked={txns[0].cleared} />
          Cleared
        </label>
      </div>

      <p class="font-bold" data-cy="sum-of-splits">
        Sum of splits: {toDollars(txns.map(txn => txn.amount || 0).reduce((acc, item) => acc + item, 0))}
      </p>

      <div>
        <label class="label">
          {type === 'banktxn' ? 'Account:' : 'Transfer From:'}
          <select
            bind:value={txns[0].from_id}
            class="input"
            data-cy="transaction-source">
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
          {#each txns as txn, i}
            <div data-cy="split-data-entry">
              <select bind:value={txn.to_id} class="input">
                <option value={null}>Select a destination</option>
                {#each to as t}
                  <option value={t.id}>{t.name}: {toDollars(t.balance)}</option>
                {/each}
              </select>

              <input
                type="number"
                class="border"
                value={txn.amount ? txn.amount / 100 : ''}
                placeholder="Dollar amount for this split"
                step="0.01"
                on:input={event => {
                  if (event.target.value) txns[i].amount = Math.round(parseFloat(event.target.value) * 100);
                }} />
            </div>
          {/each}
        </label>

        <div class="mb-3 mt-3">
          <button
            type="button"
            class="btn btn-secondary"
            on:click|preventDefault={() => (txns = [...txns, Transactions.mkEmptyTransaction(creds.userId)])}>
            New Split
          </button>
        </div>
      </div>

      <div class="flex justify-between">
        <button type="submit" class="btn btn-primary">Save Transaction</button>
        <button
          class="btn btn-tertiary"
          on:click|preventDefault={deleteTransaction}>
          Delete Transaction
        </button>
      </div>
    </form>
  </div>
{/if}
