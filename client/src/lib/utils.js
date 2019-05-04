import {getContext, setContext} from 'svelte';

export function guardCreds() {
    const creds = getContext('creds');
    if (creds) return creds;
    setContext('flash', {error: 'You must be logged in to perform this action'});
    throw new Error('[guardCreds] User is not logged in');
}
