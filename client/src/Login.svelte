<script>
    import axios from 'axios';
    import page from 'page';
    import {getContext, setContext} from 'svelte';

    const endpoint = getContext('endpoint');
    let error = null;
    let email = '';
    let password = '';

    async function handleSubmit() {
        try {
            await axios.post(
                `${endpoint}/login`, {email, password}, {withCredentials: true}
            );
            location.href = '/';  // Force the new context to get set
        } catch (ex) {
            error = ex.response.data.error;
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
