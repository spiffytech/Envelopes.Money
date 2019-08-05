<script>
  import {getContext} from 'svelte';

  const credsStore = getContext('credsStore');
  const syncStore = getContext('syncStore');
</script>

<div class="stripe bg-orange h-1" />
<div
  class="bg-white border border-grey-light rounded flex justify-between
  flex-wrap nav mb-2">
  <div class="flex">
    <a class="btn font-bold" href="/home" data-cy='home-button'>Envelopes.Money</a>

    {#if $credsStore === null}
      <a class="btn" href="#!/login">Log In</a>
    {/if}

    <a href="mailto:hello@envelopes.money?subject=Re%3A%20Feedback&body=" class="btn">Say hello!</a>

    {#if $syncStore === 'syncing'}<p class="text-center">⌛</p>{/if}
    <!--<p class="text-center">❗</p>-->
  </div>
  <div data-cy="nav-buttons">
    <a class="btn btn-primary" href="/editTxn" data-cy="new-transaction">
      New Transaction
    </a>
    <a
      class="btn btn-secondary"
      href="/editAccount"
      data-cy="new-account">
      New Account
    </a>
    <a class="btn btn-secondary" href="/fill" data-cy="fill-envelopes">
      Fill Envelopes
    </a>
    <a class="btn btn-secondary" href="/editTags" data-cy="edit-tags">
      Edit Tags
    </a>
  </div>
</div>
