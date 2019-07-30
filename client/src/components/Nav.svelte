<script>
  import {pouchStore} from '../stores/main';
  import Login from "../Login.svelte";

  let showLogIn = false;
</script>

<div class="stripe bg-orange h-1" />
<div
  class="bg-white border border-grey-light rounded flex justify-between
  flex-wrap nav mb-2">
  <div class="flex">
    <a class="btn font-bold" href="/home" data-cy='home-button'>Envelopes.Money</a>

    {#if window._env_.POUCH_ONLY && !$pouchStore.loggedIn}
      <button class="btn" on:click|preventDefault={() => showLogIn = true}>Log In</button>
    {/if}

    <a href="mailto:hello@envelopes.money?subject=Re%3A%20Feedback&body=" class="btn">Say hello!</a>

    {#if $pouchStore.state === 'active'}<p>⌛</p>{/if}
    {#if $pouchStore.state === 'error' || $pouchStore.state === 'complete'}<p title={$pouchStore.stateDetail} on:click={() => alert($pouchStore.stateDetail)}>❗</p>{/if}
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

<dialog open={showLogIn} class="shadow-md rounded-lg">
  <button on:click|preventDefault={() => showLogIn = false} class="float-right">Close</button>
  <Login />

</dialog>
