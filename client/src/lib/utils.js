const tinydate = require('tinydate').default;
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
  return tinydate('{YYYY}-{MM}-{DD}')(date);
}
