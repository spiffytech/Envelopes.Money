<script>
  import {Base64} from 'js-base64';
  import moment from 'moment';
  import page from 'page';
  import * as shortid from 'shortid';
  import {onMount} from 'svelte';

  import * as Accounts from './lib/Accounts';
  import * as Tags from './lib/Tags';

  import {guardCreds} from './lib/utils';

  const creds = guardCreds();

  export let params;

  let accountId;
  $: accountId = params.accountId ? Base64.decode(params.accountId) : null;
  let account = Accounts.mkEmptyEnvelope(creds.userId);
  let canChangeType = true;
  let tags = [];
  let newTag = {key: '', value: ''};

  $: if (accountId) {
    Accounts.loadAccount(creds, accountId).
    then(({data}) => {
      if (data.accounts.length === 0) {
        page('/404');
        return;
      }

      account = data.accounts[0];
      canChangeType = false;
    });
  }

  onMount(async () => {
    const {data} = await Tags.loadTags(creds);
    tags = data.tags.map(({tag}) => tag);
  });

  async function handleSubmit() {
    const {__typename, ...rest} = account;
    const accountWithId =
      {...rest, id: rest.id || `${rest.type}/${shortid.generate()}`}
    await Accounts.saveAccount(creds, accountWithId);
    page('/');
  }
</script>

<form class='area content bg-white p-2 rounded border border-2 border-grey-light m-4' on:submit|preventDefault={handleSubmit}>
  <header class='font-bold'>{account.name}</header>

  <input
    placeholder='Name'
    bind:value={account.name}
    class='border'
  />

  <select
    bind:value={account.type}
    disabled={!canChangeType}
  >
    <option value='envelope'>Envelope</option>
    <option value='account'>Account</option>
  </select>

  {#if account.type === 'envelope'}
    <input
      type='date'
      class='border'
      value={account.extra.due ? moment(account.extra.due).toISOString(false).slice(0, 10) : ''}
      on:input={(event) => account.extra.due = new Date(event.target.value)}
    />

    <button
      on:click|preventDefault={() => account.extra.due = null}
      class='btn btn-tertiary'
    >
      Clear due date
    </button>

    <input
      type='number'
      step='0.01'
      value={account.extra.target / 100}
      on:input={(event) => account.extra.target = Math.round(parseFloat(event.target.value) * 100)}
      class='border'
    />

    <select bind:value={account.extra.interval}>
      <option value='total'>Total</option>
      <option value='weekly'>Weekly</option>
      <option value='biweekly'>Biweekly</option>
      <option value='bimonthly'>Bimonthly</option>
      <option value='monthly'>Monthly</option>
      <option value='annually'>Annually</option>
    </select>

    <header>Tags</header>
    <div>
      {#each tags as tag}
        <div>
          <label>
            {tag}
            <input
              value={account.tags[tag] || ''}
              on:input={(event) => account.tags[tag] = event.target.value}
              class='border'
            />
          </label>
        </div>
      {/each} 

      <input
        placeholder='New tag name'
        bind:value={newTag.key}
        class='border'
      />
      <input
        placeholder='New tag value'
        bind:value={newTag.value}
        class='border'
      />

      <button
        on:click|preventDefault={(event) => {
          account = {...account, tags: {...account.tags, [newTag.key]: newTag.value}};
          tags = [...tags, newTag.key];
          newTag.key = '';
          newTag.value = '';
        }}
        class='btn btn-secondary'
      >
        Add Tag
      </button>
    </div>
  {/if}

  <button type='submit' class='btn btn-primary'>Save {account.type}</button>
</form>
