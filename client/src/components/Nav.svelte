<script>
  import {getContext} from 'svelte';

  const credsStore = getContext('credsStore');
  const navStore = getContext('navStore');

  let navLinks = [
    {text: 'New Transaction', link: '/editTxn'},
    {text: 'Fill Envelopes', link: '/fill'},
    {text: 'New Account', link: '/editAccount'},
    {text: 'Edit Tags', link: '/editTags'},
    $credsStore === null ? {text: 'Log In', link: '/login'} : {text: $credsStore.email, link: '/logout'},
  ]
</script>

<style>
  nav ul {
    list-style-type: none;
  }

  nav ul li a {
    text-decoration: none;
  }
</style>

<nav class="bg-orange" data-cy="nav-buttons" aria-label="menu">
  <ul class="p-0">
    {#each navLinks as link}
      <li class="bg-orange pl-2 pb-2 pt-2 border-b-2 border-orange-darkest">
        <a class="text-orange-darkest" href={link.link} data-cy="fill-envelopes" on:click={() => navStore.set(false)}>
          {link.text}
        </a>
      </li>
    {/each}
  </ul>
</nav>
