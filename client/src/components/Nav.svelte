<script>
  import { getContext } from 'svelte';

  import Icon from './Icon.svelte';

  const credsStore = getContext('credsStore');
  const navStore = getContext('navStore');

  $: navLinks = [
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

<nav>
  <ul class="p-0 flex justify-center">
    <li class="px-5 py-2 border"><a href="/"><Icon prefix="far" icon="envelope" size={32} /></a></li>
    <li class="px-5 py-2 border"><a href="/transactions"><Icon prefix="fas" icon="dollar-sign" size={32} /></a></li>
    <li class="px-5 py-2 border"><a href="/reports"><Icon prefix="fas" icon="chart-line" size={32} /></a></li>
  </ul>
</nav>