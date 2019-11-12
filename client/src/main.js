import 'core-js';
import 'regenerator-runtime/runtime';

import axios from 'axios';
import Debug from 'debug';
import * as Sentry from '@sentry/browser';

import App from './App.svelte';
import { endpoint } from './lib/config';
import { credsStore } from './stores/main';

const debug = Debug('Envelopes.Money:main');

if (window._env_.ALERT_ON_ERROR) {
  window.onerror = err => alert(err);
}

if (window._env_.SENTRY_DSN) {
  Sentry.init({ dsn: window._env_.SENTRY_DSN });
}

async function loadCreds() {
  try {
    debug('Loading credentials');
    const response = await axios.get(`${endpoint}/api/credentials`, {
      withCredentials: true,
    });
    debug('Loaded credentials were %o', response.data);
    return response.data;
  } catch (ex) {
    if (ex.response && ex.response.status === 401) {
      debug('No credentials were loaded');
      return null;
    } else {
      throw new Error(`[loadCreds] ${ex.message}`);
    }
  }
}

async function main() {
  const creds = await loadCreds();
  // Set this out here so that App always has the state, and never has to detect it
  credsStore.set(creds);
  new App({
    target: document.body,
    props: {},
  });
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
        registrations.forEach(registration => registration.unregister());
      });
    }
  });
}
