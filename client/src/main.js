import App from './App.svelte';

import * as accountsStore from './stores/accounts';
import * as Envelope from './lib/Envelope';

if (window.Cypress) {
	window.accountsStore = accountsStore;
	window.Envelope = Envelope;
}

const app = new App({
	target: document.body,
	props: {},
});

export default app;
