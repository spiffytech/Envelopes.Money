<script>
  import Debug from 'debug';
  import flatten from 'ramda/es/flatten';
  import groupBy from 'ramda/es/groupBy';
  import page from 'page';
  import * as shortid from 'shortid';
  import { getContext, onMount } from 'svelte';

  import Balance from './Balance.svelte';
  import Transaction from './components/Transaction.svelte';
  import * as Accounts from './lib/Accounts';
  import saveAccount from './lib/accounts/saveAccount';
  import * as Tags from './lib/Tags';
  import { formatDate } from './lib/utils';

  const debug = Debug('Envelopes.Money:EditAccount.svelte');
  const accountsStore = getContext('accountsStore');
  const {accountsColl} = getContext('kinto');
  const transactionsStore = getContext('transactionsStore');

  export let params;

  let accountId;
  $: accountId = params.accountId ? decodeURIComponent(params.accountId) : null;
  let account = Accounts.mkEmptyEnvelope();
  let canChangeType = true;
  let tags = Array.from(
    new Set(
      flatten($accountsStore.filter(account => account.type === 'envelope').map(({ tags }) => tags).map(tags => Object.keys(tags)))
    )
  );
  let newTag = { key: '', value: '' };

  let txns = [];
  const numItemsPerPage = 100;
  let pageNum = 0;

  onMount(async () => {
    if (accountId) {
      const account_ = $accountsStore.find((account) => account.id === accountId);
      debug('Loading page with account ID %s', accountId);
      debug('Found existing account? %s', !!account_);
      if (!account_) {
        page('/404');
      } else {
        account = account_;
        canChangeType = false;
        const foundTxns = $transactionsStore.filter(txn => txn.from_id === accountId || txn.to_id == accountId);
        debug('Found the following transactions for this account: %o', foundTxns);
        if (account.type === 'account') {
          const groups = groupBy(txn => txn.txn_id, foundTxns);
          txns = Object.values(groups).map(txnGroup => ({
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
        } else {
          txns = foundTxns;
        }
      }
    }
  });

  async function handleSubmit() {
    const { __typename, type_, _id, _rev, ...rest } = account;
    const newAccountId = account.id || `${rest.type}/${shortid.generate()}`;
    const accountWithId = { ...rest, id: newAccountId };

    await saveAccount({ accountsStore }, {accountsColl}, accountWithId);
    page('/');
  }
</script>

<form
  class="area content bg-white p-2 rounded border border-2 border-grey-light m-4"
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

  <button type="submit" class="btn btn-primary">Save {account.type}</button>
</form>

<Balance {account} defaultDaysToRender={15} />

{#each txns.slice(pageNum * numItemsPerPage, (pageNum + 1) * numItemsPerPage) as txn}
  <Transaction {txn} />
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
