import App from "./App.svelte";

import * as accountsStore from "./stores/accounts";
import * as Envelope from "./lib/Envelope";
import LogRocket from "logrocket";

if (window.Cypress) {
  window.accountsStore = accountsStore;
  window.Envelope = Envelope;
}

const app = new App({
  target: document.body,
  props: {}
});

export default app;

if (process.env.LOGROCKET_APP) {
  LogRocket.init(process.env.LOGROCKET_APP, {
    network: { isEnabled: false },
    dom: { isEnabled: false }
  });
}
