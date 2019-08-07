<script>
  import { getContext } from 'svelte';

  const syncStore = getContext('syncStore');
  const navStore = getContext('navStore');
</script>

<div class="stripe bg-orange-500 h-1" />

<div
  class="bg-white border border-t-0 border-gray-400 rounded flex mb-2
  items-center"
  role="banner">
  <button
    id="hamburger"
    on:click|preventDefault={() => navStore.set(!$navStore)}
    class="text-5xl sm:hidden"
    class:open={$navStore}>
    &equiv;
  </button>

  <a
    class="btn font-bold"
    href="/home"
    data-cy="home-button"
    role="heading"
    aria-level="1">
    Envelopes.Money
  </a>

  <a
    href="mailto:hello@envelopes.money?subject=Re%3A%20Feedback&body="
    class="btn"
    role="button">
    Say hello!
  </a>

  {#if $syncStore === 'syncing'}
    <p>⌛</p>
  {/if}
</div>
