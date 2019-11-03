<script>
  import comparator from 'ramda/es/comparator';
  import Debug from 'debug';
  import haversine from 'haversine';
  import map from 'ramda/es/map';
  import page from 'page';
  import groupBy from 'ramda/es/groupBy';
  import uniqBy from 'ramda/es/uniqBy';
  import * as shortid from 'shortid';
  import { getContext, onMount } from 'svelte';

  import { toDollars } from './lib/pennies';
  import * as Transactions from './lib/Transactions';
  import { formatDate } from './lib/utils';
  import saveTransactions from './lib/transactions/saveTransactions';
  import deleteTransactions from './lib/transactions/deleteTransactions';

  const accountsStore = getContext('accountsStore');
  const activityEmitter = getContext('activityEmitter');
  const transactionsStore = getContext('transactionsStore');
  const dexie = getContext('dexie');
  const balancesStore = getContext('balancesStore');

  const debug = Debug('Envelopes.Money:EditTxn.svelte');

  export let params;
  let txnId;
  $: txnId = params.txnId
    ? decodeURIComponent(decodeURIComponent(params.txnId))
    : undefined;

  let coordinates = null;
  let geoPayees = [];

  // This takes care of while we're initializing
  let txns = [Transactions.mkEmptyTransaction()];
  let type = txns.map(txn => txn.type)[0] || 'banktxn';

  function getCoordinates() {
    return Promise.race([
      new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
      new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({latitude: pos.coords.latitude, longitude: pos.coords.longitude}),
            (err) => reject(err)
          );
        } else {
          debug('No support for geolocation in this browser');
          return null;
        }
      })
    ]);
  }

  // This takes care of when our props change
  onMount(async () => {
    if (txnId) {
      const txnsByGroupId = $transactionsStore.filter(txn => txn.txn_id === txnId);
      if (txnsByGroupId.length === 0) {
        return page('/404');
      }
      txns = txnsByGroupId;
      type = txnsByGroupId[0].type;
      coordinates = txnsByGroupId[0].coordinates;
    } else {
      coordinates = await getCoordinates();

      // Try guessing the user's payee if they haven't started filling things
      // in yet
      if (!txns[0].label) {
        const txnsWithCoordinates = $transactionsStore.filter(txn => txn.type === 'banktxn' && txn.label && txn.coordinates);
        const nearbyTxns = txnsWithCoordinates.map(txn => {
          const distance = haversine(coordinates, txn.coordinates, {unit: 'mile'});
          return {...txn, distance};
        });
        const txnsByDistance = nearbyTxns.sort(comparator((a, b) => a.distance < b.distance));
        const uniqPayees = uniqBy(txn => txn.label, txnsByDistance.filter(({distance}) => distance < 0.25));
        geoPayees = uniqPayees
      }
    }
  });

  let finalTxnId;
  $: finalTxnId = txnId || shortid.generate();
  let derivedTxns;
  $: derivedTxns = txns
    .map(txn => ({
      ...txn,
      label: txns[0].label,
      date: txns[0].date,
      memo: txns[0].memo,
      from_id: txns[0].from_id,
      cleared: txns[0].cleared,
      ...(type === 'banktxn' ? {coordinates} : {}),
      type,
      txn_id: finalTxnId,
    }))
    .map(txn => {
      const { __typename, insertion_order, _id, _rev, type_, user_id, ...rest } = txn;
      return rest;
    })
    .filter(txn => txn.amount != 0);

  let allLabels = [];

  /**
    Searches our transactions database for all of the labels we've paid to, and
    groups them by what accounts they're most likely to go with
   */
  async function setAllLabels(transactions) {
    const rows = Object.values(groupBy(arr => arr.join('-'), transactions.map(txn => [txn.label, txn.from_id, txn.to_id]))).map(rows => ({key: rows[0], value: rows.length}));
    const byLabel = groupBy(row => row.key[0], rows);
    Object.values(byLabel).forEach(rows =>
      rows.sort(comparator((a, b) => a.value > b.value))
    );
    const topByLabel = map(rows => rows[0], byLabel); //.map(({key}) => ({from_id: key[1], to_id: key[2]})), byLabel);
    allLabels = map(
      ({ key }) => ({ from_id: key[1], to_id: key[2] }),
      topByLabel
    );
  }
  $: setAllLabels($transactionsStore);

  $: accounts = groupBy(b => b.type, $accountsStore);
  let from;
  $: from =
    type === 'banktxn'
      ? accounts['account']
      : type === 'accountTransfer'
      ? accounts['account']
      : accounts['envelope'];
  let to;
  $: to =
    type === 'banktxn'
      ? accounts['envelope']
      : type === 'accountTransfer'
      ? accounts['account']
      : accounts['envelope'];

  function setSuggestion(suggestion) {
    if (!allLabels[suggestion]) return;
    txns = txns.map(txn => ({ ...txn, label: suggestion }));
    txns[0].to_id = allLabels[suggestion].to_id;
    txns[0].from_id = allLabels[suggestion].from_id;
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
      error = 'You must have at least one non-zero split';
      return;
    }
    error = null; // Reset it if we got here

    await saveTransactions({transactionsStore}, dexie, derivedTxns);
    activityEmitter.emit('transactionsChanged');
    page('/home');
  }

  async function deleteTransaction() {
    if (!txnId) return;
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    deleteTransactions({transactionsStore}, dexie, txnId);
    activityEmitter.emit('transactionsChanged');
    page('/home');
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
  <form
    on:submit|preventDefault={handleSubmit}
    class="m-auto flex flex-wrap justify-around"
    data-cy="edittxn-form">
    <div class="flex-auto max-w-sm px-0 sm:px-3">
      <div class="flex flex-col">
        <label class="label-inline" for="txntype">
          Transaction Type
        </label>
        <select bind:value={type} class="input-inline" id="txntype">
          <option value="banktxn">Bank Transaction</option>
          <option value="envelopeTransfer">Envelope Transfer</option>
          <option value="accountTransfer">Account Transfer</option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="label-inline" for="from">
          Who did you pay?
        </label>
        <input bind:value={txns[0].label} on:input={(event) => setSuggestion(event.target.value)} class="input-inline" data-cy="label" list="suggested-payees" id="from" />
        <datalist id="suggested-payees">
          {#each Object.keys(allLabels) as suggestion}
            <option data-cy="suggested-payee" value={suggestion}>
              {suggestion}
            </option>
          {/each}
        </datalist>
      </div>

      {#each geoPayees as geoPayee}
        <div>
          <button class="btn btn-tertiary" on:click|preventDefault={() => setSuggestion(geoPayee.label)}>
            {geoPayee.label} ({geoPayee.distance.toFixed(2)}mi)
          </button>
        </div>
      {/each}

      <div class="flex flex-col">
        <label class="label-inline" for="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          list="dates-list"
          value={formatDate(txns[0].date)}
          class="input-inline"
          on:input={event => (txns[0].date = formatDate(new Date(event.target.value + 'T00:00')))} />

        <datalist id="dates-list">
          <option label="Today">{formatDate(new Date())}</option>
          <option label="Yesterday">{formatDate(new Date(new Date().setDate(new Date().getDate()-1)))}</option>
        </datalist>
      </div>

      <div class="flex flex-col">
        <label class="label-inline" for="memo">
          Memo
        </label>
        <input bind:value={txns[0].memo} class="input-inline" id="memo" />
      </div>

      <div>
        <label>
          <input type="checkbox" bind:checked={txns[0].cleared} />
          Cleared
        </label>
      </div>

      {#if type === 'banktxn' && !txnId}
        <div>Location: {@html coordinates ? '&#10003;' : '&#10007;'}</div>
      {/if}
    </div>


    <div class="flex-auto max-w-sm px-0 sm:px-3">
      <p class="font-bold" data-cy="sum-of-splits">
        Sum of splits: {toDollars(txns.map(txn => txn.amount || 0).reduce((acc, item) => acc + item, 0))}
      </p>

      <div class="flex flex-col">
        <label class="label-inline" for="account">
          {type === 'banktxn' ? 'Account' : 'Transfer From'}
        </label>
        <select
          id="account"
          bind:value={txns[0].from_id}
          class="input-inline"
          data-cy="transaction-source">
          <option value={null}>Select a source</option>
          {#each from as f}
            <option value={f.id}>{f.name}: {toDollars($balancesStore[f.id])}</option>
          {/each}
        </select>
      </div>

      <fieldset>
        <legend>
          {type === 'banktxn' ? 'Envelopes' : 'Transfer Into'}
        </legend>

        {#each txns as txn, i}
          <div class="flex flex-col" data-cy="split-data-entry">
            <label class="label-inline" for={`destination-${i}`}>Destination</label>
            <select bind:value={txn.to_id} class="input-inline" id={`destination-${i}`}>
              <option value={null}>Select a destination</option>
              {#each to as t}
                <option value={t.id}>{t.name}: {toDollars($balancesStore[t.id])}</option>
              {/each}
            </select>

            <label class="label-inline" for={`amount-${i}`}>Amount</label>
            <input
              id={`amount-${i}`}
              type="number"
              class="input-inline"
              value={txn.amount ? txn.amount / 100 : ''}
              step="0.01"
              on:input={event => {
                if (event.target.value) txns[i].amount = Math.round(parseFloat(event.target.value) * 100);
              }} />
            </div>

            <hr />
          {/each}
        </fieldset>

        <div class="mb-3 mt-3">
          <button
            type="button"
            class="btn btn-secondary"
            on:click|preventDefault={() => (txns = [...txns, Transactions.mkEmptyTransaction()])}>
            New Split
          </button>
        </div>

      <div class="flex justify-between">
        <button type="submit" class="btn btn-primary">Save Transaction</button>
        <button
          class:hidden={!txnId}
          class="btn btn-tertiary"
          on:click|preventDefault={deleteTransaction}>
          Delete Transaction
        </button>
      </div>
    </div>
  </form>
{/if}
