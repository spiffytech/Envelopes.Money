<script>
  import axios from 'axios';
  import Debug from 'debug';
  import { getContext } from 'svelte';

  import initPouch from './lib/pouch';
  import * as libPouch from './lib/pouch';

  const debug = Debug('Envelopes.Money:Login.svelte');

  const endpoint = getContext('endpoint');
  let error = null;
  let email = '';
  let password = '';

  async function handleSubmit() {
    try {
      debug('Logging in with Hasura');
      if (!window._env_.POUCH_ONLY) {
        await axios.post(
          `${endpoint}/login`,
          { email, password },
          { withCredentials: true }
        );
      }
      if (window._env_.USE_POUCH) {
        debug('Logging in with CouchDB');
        const remoteDB = libPouch.mkRemote(email);
        debug('Initialized main PouchDB');
        debug('Login results: %o', await remoteDB.logIn(email, password));
        const metaDB = libPouch.initMetaDB();
        debug(
          'Stored credentials: %O',
          await metaDB.upsert('creds', doc => ({
            email,
            password,
            _id: 'creds',
            _rev: doc._rev,
          }))
        );
      }
      location.href = '/'; // Force the new context to get set
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
