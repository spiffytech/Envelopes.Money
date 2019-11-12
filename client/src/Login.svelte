<script>
  import axios from 'axios';
  import Debug from 'debug';
  import { getContext } from 'svelte';
  import page from 'page';

  const debug = Debug('Envelopes.Money:Login.svelte');

  const endpoint = getContext('endpoint');
  const credsStore = getContext('credsStore');
  let error = null;
  let email = '';
  let password = '';

  async function handleSubmit() {
    if (!email) {
      error = 'Must enter your email';
      return;
    }
    if (!password) {
      error = 'Must enter your password';
      return;
    }
    error = null;

    try {
      debug('Logging in with Hasura');
      const {data: {apikey, userId}} = await axios.post(
        `${endpoint}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      credsStore.set({email, apikey, userId});
      page('/');
      window.location.reload();
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

  async function signUp() {
    if (!email) {
      error = 'Must enter your email';
      return;
    }
    if (!password) {
      error = 'Must enter your password';
      return;
    }
    error = null;

    try {
      debug('Logging in with Hasura');
      const {data: {apikey, userId}} = await axios.post(
        `${endpoint}/auth/signup`,
        { email, password },
        { withCredentials: true }
      );
      credsStore.set({email, apikey, userId});
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
    Email:
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
  <button type="button" class="btn btn-primary" on:click={signUp}>Sign Up</button>
  <button />
</form>
