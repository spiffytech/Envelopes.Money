<script>
    import axios from 'axios';
    import Debug from 'debug';
    import {getContext} from 'svelte';

    import initPouch from './lib/pouch';
    import {initMetaDB} from './lib/pouch';

    const debug = Debug('Envelopes.Money:Login.svelte');

    const endpoint = getContext('endpoint');
    let error = null;
    let email = '';
    let password = '';

    async function handleSubmit() {
        try {
          if (!window._env_.USE_POUCH) {
            debug('Logging in with Hasura')
            await axios.post(
                `${endpoint}/login`, {email, password}, {withCredentials: true}
            );
          } else {
            debug('Logging in with CouchDB');
            debug('Stored the user\'s credentials');
            const localDB = await initPouch(email, password);
            debug('Initialized main PouchDB');
            debug('Login results: %o', await localDB.remoteDB.logIn(email, password));
            const metaDB = initMetaDB();
            debug('Stored credentials: %O', await metaDB.upsert('creds', doc => ({email, password, _id: 'creds', _rev: doc._rev})));
          }
            location.href = '/';  // Force the new context to get set
        } catch (ex) {
          if (ex.response) {
            error = ex.response.data.error;
          } else {
            throw ex;
          }
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <header class="font-bold">Log In</header>

    {#if error}<p class='error'>{error}</p>{/if}

    <label>
        Username:
        <input
            type="email"
            placeholder="username"
            class="border w-full"
            bind:value={email}
            required
        />
    </label>

    <label>
        Password
        <input
            type="password"
            placeholder="password"
            class="border w-full"
            bind:value={password}
            required
        />
    </label>

    <button type="submit" class='btn btn-primary'>Log In</button><button>
</form>
