<script>
  import fromPairs from 'lodash/fromPairs';
  import page from 'page';
  import {onMount} from 'svelte';
  
  import * as Accounts from './lib/Accounts';
  import * as Tags from './lib/Tags';
  import {guardCreds} from './lib/utils';

  const creds = guardCreds();
  let initializeP = new Promise(() => null);
  let allTags = [];
  let accounts = [];
  let selectedTag = null;
  let error = null;

  onMount(() => {
    async function initialize() {
      const {data: tags} = await Tags.loadTags(creds);
      allTags = tags.tags.map(({tag}) => tag);

      const {data: accountsData} = await Accounts.loadAccounts(creds);
      accounts =
        accountsData.accounts.
        filter(Accounts.isEnvelope).
        sort((a, b) => a.name < b.name ? -1 : 1);
    }

    initializeP = initialize();
  });

  async function handleSubmit() {
    const accountsWithSelectedTag = fromPairs(
      accounts.
      filter((account) => account.tags[selectedTag]).
      map((account) => [account.id, {[selectedTag]: account.tags[selectedTag]}])
    );
    try {
      await Tags.updateAccountsTags(creds, accountsWithSelectedTag)
      error = null;
      page('/home');
    } catch (ex) {
      error = ex.message;
    }
  }
</script>

{#await initializeP}
  <p>Loading...</p>
{:then}
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
                on:input={(event) => account.tags[selectedTag] = event.target.value}
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
{:catch ex}
  <p>Error! {ex.message}</p>
{/await}
