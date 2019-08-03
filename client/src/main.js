import "core-js";
import "regenerator-runtime/runtime";

import axios from 'axios';
import Debug from 'debug';
import LogRocket from 'logrocket';

import App from './App.svelte';
import * as accountsStore from './stores/accounts';
import * as Envelope from './lib/Envelope';
import { initMetaDB } from './lib/pouch';

const debug = Debug('Envelopes.Money:main');

if (window._env_.ALERT_ON_ERROR) {
  window.onerror = err => alert(err);
}

async function main() {
  if (window._env_.POUCH_ONLY && !window._env_.USE_POUCH) {
    alert('Invalid settings');
    throw new Error('Must use pouch if using Pouch only');
  }

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
      debug("Didn't find the credentials in the DB");
    }
  }

  if (!window._env_.POUCH_ONLY) {
    try {
      const response = await axios.get('/api/credentials', {
        withCredentials: true,
      });
      creds = { ...(creds || {}), ...response.data };
    } catch (ex) {
      creds = null;
    }
  }

  if (window.Cypress) {
    window.accountsStore = accountsStore;
    window.Envelope = Envelope;
  }

  new App({
    target: document.body,
    props: { creds },
  });

  if (navigator.storage && navigator.storage.persist) {
    const persistent = await navigator.storage.persist();
    debug('Storage is persistent? %s', persistent);
  } else {
    debug('Persistent storage not supported on this device');
  }

  if (window._env_.LOGROCKET_APP) {
    LogRocket.init(window._env_.LOGROCKET_APP, {
      network: { isEnabled: false },
      dom: { isEnabled: false },
    });
  }
}

main();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (!window._env_.DISABLE_SERVICE_WORKER) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          debug('SW registered: %s', registration);
        })
        .catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
        });
    } else {
      debug('Unregistering the service worker');
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach((registration) => registration.unregister())
      });
    }
  });
}
