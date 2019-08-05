<script>
  import axios from 'axios';
  import Debug from 'debug';
  import { getContext } from 'svelte';
  import page from 'page';

  import initPouch from './lib/pouch';
  import * as libPouch from './lib/pouch';

  const debug = Debug('Envelopes.Money:Login.svelte');

  const endpoint = getContext('endpoint');
  const credsStore = getContext('credsStore');
  let error = null;
  let email = '';
  let password = '';

  async function handleSubmit() {
    try {
      debug('Logging in with Hasura');
      const {data: {apikey, userId}} = await axios.post(
        `${endpoint}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      credsStore.set({apikey, userId});
      page('/');
    } catch (ex) {
      if (ex.response) {
        error = ex.response.data.error;
      } else if (ex.status === 401) {
        error = ex.message;
      } else {
        throw ex;
      }
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <header class="font-bold">Log In</header>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <label>
    Username:
    <input
      type="email"
      placeholder="username"
      class="border w-full"
      bind:value={email}
      required />
  </label>

  <label>
    Password
    <input
      type="password"
      placeholder="password"
      class="border w-full"
      bind:value={password}
      required />
  </label>

  <button type="submit" class="btn btn-primary">Log In</button>
  <button />
</form>
