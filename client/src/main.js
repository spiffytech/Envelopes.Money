import "core-js";
import "regenerator-runtime/runtime";

import Debug from 'debug';
import LogRocket from 'logrocket';

import App from './App.svelte';

const debug = Debug('Envelopes.Money:main');

if (window._env_.ALERT_ON_ERROR) {
  window.onerror = err => alert(err);
}

async function main() {
  new App({
    target: document.body,
    props: {},
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
