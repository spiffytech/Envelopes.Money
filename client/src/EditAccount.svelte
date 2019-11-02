<script>
  import Debug from 'debug';
  import flatten from 'ramda/es/flatten';
  import groupBy from 'ramda/es/groupBy';
  import identity from 'ramda/es/identity';
  import page from 'page';
  import * as shortid from 'shortid';
  import { getContext, onMount } from 'svelte';

  import Balance from './Balance.svelte';
  import PlaidLink from './components/PlaidLink.svelte';
  import Transaction from './components/Transaction.svelte';
  import * as Accounts from './lib/Accounts';
  import saveAccount from './lib/accounts/saveAccount';
  import * as Tags from './lib/Tags';
  import { formatDate } from './lib/utils';
  import { toDollars } from './lib/pennies';

  const debug = Debug('Envelopes.Money:EditAccount.svelte');
  const accountsStore = getContext('accountsStore');
  const activityEmitter = getContext('activityEmitter');
  const dexie = getContext('dexie');
  const transactionsStore = getContext('transactionsStore');

  function findTxnsForAccount(transactions, account) {
    const foundTxns = transactions.filter(
      txn => txn.from_id === accountId || txn.to_id == accountId
    );
    debug(
      `Found the following transactions for this ${account.type}: %o`,
      foundTxns
    );
    if (account.type === 'envelope') return foundTxns;
    const groups = groupBy(txn => txn.txn_id, foundTxns);
    return Object.values(groups).map(txnGroup => ({
      to_ids: txnGroup.map(txn => txn.to_id),
      amount: txnGroup
        .map(txn => -txn.amount)
        .reduce((acc, item) => acc + item, 0),
      txn_id: txnGroup[0].txn_id,
      user_id: txnGroup[0].user_id,
      label: txnGroup[0].label,
      date: txnGroup[0].date,
      memo: txnGroup[0].memo,
      from_id: txnGroup[0].from_id,
      type: txnGroup[0].type,
      insertionOrder: txnGroup[0].insertion_order,
      cleared: txnGroup[0].cleared,
    }));
  }

  export let params;

  let accountId;
  $: accountId = params.accountId ? decodeURIComponent(params.accountId) : null;
  $: canChangeType = !Boolean(
    $accountsStore.find(account => account.id === accountId)
  );
  let account = Accounts.mkEmptyEnvelope();
  $: account =
    $accountsStore.find(account => account.id === accountId) ||
    account;
  let tags = Array.from(
    new Set(
      flatten(
        $accountsStore
          .filter(account => account.type === 'envelope')
          .map(({ tags }) => tags)
          .map(tags => Object.keys(tags))
      )
    )
  );
  let newTag = { key: '', value: '' };

  let searchTerm = '';
  // Must be reactive in case our accountId URL param changes
  $: accountsMap = new Map(
    $accountsStore.map(account => [account.id, account])
  );
  // Calculate this as a separate step from the searchTerm filtering so we
  // don't recalculate this every time the search term changes
  $: txnsForAccount = findTxnsForAccount($transactionsStore, account);
  $: txns = txnsForAccount.filter(
    txn =>
      (txn.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.memo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      toDollars(txn.amount).includes(searchTerm) ||
      txn.date.includes(searchTerm) ||
      accountsMap
        .get(txn.from_id)
        .name.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      // We have to treat this as an array because we have to_ids field when
      // viewing a bank account
      (txn.to_ids ? txn.to_ids : [txn.to_id])
        .map(accountId =>
          accountsMap
            .get(accountId)
            .name.toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
        .filter(identity).length > 0
  );

  const numItemsPerPage = 100;
  let pageNum = 0;

  async function handleSubmit() {
    const { __typename, type_, _id, _rev, ...rest } = account;
    const newAccountId = account.id || `${rest.type}/${shortid.generate()}`;
    const accountWithId = { ...rest, id: newAccountId };

    await saveAccount({ accountsStore }, dexie, accountWithId);
    activityEmitter.emit('accountsChanged');
    page('/');
  }
</script>

<form
  class="area content bg-white p-2 rounded border border-2 border-gray-400 m-4"
  on:submit|preventDefault={handleSubmit}>
  <header class="font-bold">{account.name}</header>

  <input
    placeholder="Name"
    bind:value={account.name}
    class="border"
    data-cy="name" />

  <select bind:value={account.type} disabled={!canChangeType}>
    <option value="envelope">Envelope</option>
    <option value="account">Account</option>
  </select>

  {#if account.type === 'envelope'}
    <input
      type="date"
      class="border"
      value={account.extra.due ? formatDate(account.extra.due) : ''}
      on:input={event => {
        const newDate = new Date(event.target.value);
        if (isNaN(newDate.getTime())) return;
        account.extra.due = newDate;
      }}
      data-cy="due-date" />

    <button
      on:click|preventDefault={() => (account.extra.due = null)}
      class="btn btn-tertiary">
      Clear due date
    </button>

    <input
      type="number"
      step="0.01"
      value={account.extra.target / 100 || ''}
      on:input={event => (account.extra.target = Math.round(parseFloat(event.target.value) * 100))}
      class="border"
      data-cy="target" />

    <select bind:value={account.extra.interval}>
      <option value="total">Total</option>
      <option value="weekly">Weekly</option>
      <option value="biweekly">Biweekly</option>
      <option value="bimonthly">Bimonthly</option>
      <option value="monthly">Monthly</option>
      <option value="annually">Annually</option>
    </select>

    <header>Tags</header>
    <div>
      {#each tags as tag}
        <div>
          <label>
            {tag}
            <input
              value={account.tags[tag] || ''}
              on:input={event => (account.tags[tag] = event.target.value)}
              class="border" />
          </label>
        </div>
      {/each}

      <input
        placeholder="New tag name"
        bind:value={newTag.key}
        class="border"
        data-cy="new-tag-name" />
      <input
        placeholder="New tag value"
        bind:value={newTag.value}
        class="border"
        data-cy="new-tag-value" />

      <button
        on:click|preventDefault={event => {
          account = { ...account, tags: { ...account.tags, [newTag.key]: newTag.value } };
          tags = [...tags, newTag.key];
          newTag.key = '';
          newTag.value = '';
        }}
        class="btn btn-secondary"
        data-cy="add-tag">
        Add Tag
      </button>
    </div>
  {/if}

  {#if account.type === 'account'}
    <PlaidLink />
  {/if}

  <button type="submit" class="btn btn-primary">Save {account.type}</button>
</form>

<Balance {account} defaultDaysToRender={15} />

<div class="flex flex-col mb-5">
  <label for="search" class="label-inline">Search Transactions</label>
  <input id="search" class="input-inline" bind:value={searchTerm} />
</div>

{#each txns.slice(pageNum * numItemsPerPage, (pageNum + 1) * numItemsPerPage) as txn (txn.txn_id)}
  <Transaction {txn} />
{:else}
  {#if searchTerm !== ''}
    <p>Nothing matched that search</p>
  {:else}
    <p>Nothing to show here</p>
  {/if}
{/each}

{#each new Array(Math.ceil(txns.length / numItemsPerPage))
  .fill(null)
  .map((_, i) => i) as btn_number}
  <button
    on:click|preventDefault={() => (pageNum = btn_number)}
    class="btn btn-secondary">
    Page {btn_number + 1}
  </button>
{/each}
