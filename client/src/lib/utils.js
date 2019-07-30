import {getContext, setContext} from 'svelte';

export function guardCreds() {
    const creds = getContext('creds');
    if (creds) return creds;
    setContext('flash', {error: 'You must be logged in to perform this action'});
    throw new Error('[guardCreds] User is not logged in');
}


export const durations = {
  total: 0,
  weekly: 7,
  biweekly: 14,
  bimonthly: 15,
  monthly: 30,
  annually: 365,
};

export function formatDate(date) {
  if (typeof date === 'string') date = new Date(date + 'T00:00');
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

export function myDebounce(fn, wait) {
  let capturedArgs = [];
  let timeout = null;
  return arg => {
    capturedArgs.push(arg);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(capturedArgs.slice());
      capturedArgs = [];
    }, wait);
  };
}
