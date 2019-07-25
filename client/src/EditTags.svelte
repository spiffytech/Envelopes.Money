<script>
  import Debug from 'debug';
  import page from 'page';
  import fromPairs from 'ramda/es/fromPairs';
  import {getContext, onMount} from 'svelte';
  import {arrays as derivedStore, store} from './stores/main';
  
  import * as Accounts from './lib/Accounts';
  import * as Tags from './lib/Tags';
  import {PouchAccounts} from './lib/pouch';

  const debug = Debug('Envelopes.Money:EditTags.svelte');

  const graphql = getContext('graphql');
  let allTags = $derivedStore.tags;
  let accounts = $derivedStore.envelopes;
  let selectedTag = null;
  let error = null;
  let dirty = {};

  async function handleSubmit() {
    if (!window._env_.USE_POUCH) {
      const accountsWithSelectedTag = fromPairs(
        accounts.
        filter((account) => account.tags[selectedTag]).
        map((account) => [account.id, {[selectedTag]: account.tags[selectedTag]}])
      );

      const accountsWithoutSelectedTag =
        accounts.
        filter((account) => !account.tags[selectedTag]).
        map((account) => account.id);
    
      try {
        await Tags.updateAccountsTags(graphql, accountsWithSelectedTag)
        await Tags.deleteTagFromAccounts(graphql, selectedTag, accountsWithoutSelectedTag);
        error = null;
        page('/home');
      } catch (ex) {
        error = ex.message;
        throw ex;
      }
    } else {
      const accountsThatChanged = accounts.filter((account) => dirty[account.id]);
      debug('These accounts changed: %o', accountsThatChanged);

      const pouchAccounts = new PouchAccounts(graphql.localDB);
    }
  }
</script>

<div class='flex justify-around'>
  {#if error}<p>{error}</p>{/if}

  <form on:submit|preventDefault={handleSubmit} class='content'>
    <select bind:value={selectedTag} class='border'>
      <option value={null}>Select a tag</option>
      {#each allTags as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>

    {#if selectedTag}
      {#each accounts as account}
        <div>
          <label class='label'>
            {account.name}
            <input
              class='input'
              value={account.tags[selectedTag] || ''}
              on:input={(event) => {
                account.tags[selectedTag] = event.target.value
                dirty[account.id] = true;
              }}
            />
          </label>
        </div>
      {/each}

      <div>
        <button type="submit" class='btn btn-primary'>Save Tags</button>
      </div>
    {/if}
  </form>
</div>