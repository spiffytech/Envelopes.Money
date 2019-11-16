<script>
  import { getContext } from 'svelte';

  const credsStore = getContext('credsStore');
  const navStore = getContext('navStore');

  $: navLinks = [
    { text: 'New Transaction', link: '/editTxn' },
    { text: 'Fill Envelopes', link: '/fill' },
    { text: 'New Account', link: '/editAccount' },
    { text: 'Edit Tags', link: '/editTags' },
    { text: 'Reports', link: '/reports' },
    { text: 'Transactions', link: '/transactions' },
    $credsStore === null
      ? { text: 'Log In', link: '/login' }
      : { text: 'Log Out', link: '/logout' },
  ];
</script>

<style>
  nav ul {
    list-style-type: none;
  }

  nav ul li a {
    text-decoration: none;
  }
</style>

{#if $navStore}
  <nav class="bg-orange-500 block sm:hidden" data-cy="nav-buttons" aria-label="menu">
    <ul class="p-0">
      {#each navLinks as link}
        <li class="bg-orange-500 pl-2 pb-2 pt-2 border-b-2 border-gray-900">
          <a
            class="text-gray-900"
            href={link.link}
            data-cy="fill-envelopes"
            on:click={() => navStore.set(false)}>
            {link.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<nav class="bg-orange-500 hidden sm:block" data-cy="nav-buttons" aria-label="menu">
  <ul class="flex p-0">
    {#each navLinks as link}
      <li class="p-2 border-2 border-gray-900">
        <a
          class="text-gray-900"
          href={link.link}
          data-cy="fill-envelopes">
          {link.text}
        </a>
      </li>
    {/each}
  </ul>
</nav>
