<script>
  import Debug from 'debug';
  import flatten from 'ramda/es/flatten';
  import page from 'page';
  import { getContext } from 'svelte';

  import saveAccountsRemote from './lib/accounts/saveAccountsRemote';

  const debug = Debug('Envelopes.Money:EditTags.svelte');

  const accountsStore = getContext('accountsStore');
  const activityEmitter = getContext('activityEmitter');
  const wsclientStore = getContext('wsclientStore');

  let accounts = $accountsStore.filter(account => account.type === 'envelope');
  let allTags = Array.from(
    new Set(
      flatten(accounts.map(({ tags }) => tags).map(tags => Object.keys(tags)))
    )
  );
  let selectedTag = null;
  let error = null;
  let dirty = {};

  async function handleSubmit() {
    const accountsThatChanged = accounts.filter(account => dirty[account.id]);
    debug('These accounts changed: %o', accountsThatChanged);
    await saveAccountsRemote($wsclientStore, accountsThatChanged);
    activityEmitter.emit('accountsChanged');
    page('/home');
  }
</script>

<div class="flex justify-around">
  {#if error}
    <p>{error}</p>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="content">
    <select bind:value={selectedTag} class="border">
      <option value={null}>Select a tag</option>
      {#each allTags as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>

    {#if selectedTag}
      {#each accounts as account}
        <div>
          <label class="label">
            {account.name}
            <input
              class="input"
              value={account.tags[selectedTag] || ''}
              on:input={event => {
                account.tags[selectedTag] = event.target.value;
                dirty[account.id] = true;
              }} />
          </label>
        </div>
      {/each}

      <div>
        <button type="submit" class="btn btn-primary">Save Tags</button>
      </div>
    {/if}
  </form>
</div>
