<script>
  import axios from 'axios';
  import page from 'page';
  import { getContext, onMount } from 'svelte';

  const endpoint = getContext('endpoint');

  const dexie = getContext('dexie');

  async function logout() {
    await dexie.delete();

    await axios.post(`${endpoint}/api/logout`, {}, { withCredentials: true });

    page('/login');
    window.location.reload();
  }

  onMount(() => logout());
</script>
