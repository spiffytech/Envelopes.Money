import axios from "axios";
import Debug from 'debug';
import LogRocket from "logrocket";

import App from "./App.svelte";
import * as accountsStore from "./stores/accounts";
import * as Envelope from "./lib/Envelope";
import {initMetaDB} from './lib/pouch';

const debug = Debug('Envelopes.Money:main');

async function main() {
  let creds;
  if (window._env_.USE_POUCH) {
    debug('Checking for CouchDB credentials in IndexedDB');
    const metaDB = initMetaDB();
    try {
      creds = await metaDB.get('creds');
      debug('Found credentials in the DB');
    } catch (ex) {
      if (ex.status !== 404) {
        alert(ex.message);
      }
      debug('Didn\'t find the credentials in the DB');
    }
  } else {
    try {
      const response = await axios.get("/api/credentials", { withCredentials: true })
      creds = response.data;
    } catch (ex) {
      // pass
    }
  }

  if (window.Cypress) {
    window.accountsStore = accountsStore;
    window.Envelope = Envelope;
  }

  new App({
    target: document.body,
    props: { creds }
  });

  if (window._env_.LOGROCKET_APP) {
    LogRocket.init(window._env_.LOGROCKET_APP, {
      network: { isEnabled: false },
      dom: { isEnabled: false }
    });
  }
}

main();
