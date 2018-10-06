/* tslint:disable:no-console */

import * as StoreTypes from '../store/types';
import AccountTransfer from './AccountTransfer';
import BankTxn from './BankTxn';
import EnvelopeTransfer from './EnvelopeTransfer';
import * as Txns from './txns';
import * as Types from './types';

export function formatCurrency(dollars: Txns.Dollars): string {
  return Intl.NumberFormat(
    navigator.language || 'en-US',
    {minimumIntegerDigits: 1, minimumFractionDigits: 2, maximumFractionDigits: 2},
  ).format(dollars);
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export function activeDB(state: StoreTypes.RootState & {couch: StoreTypes.CouchState}): PouchDB.Database<{}> {
  return state.couch.pouch;
  /*
  if (state.couch.couch) return state.couch.couch;
  // if (state.couch.inSync || !state.couch.canTalkToRemote || !state.isOnline || !state.couch.couch) {
  if (!state.couch.canTalkToRemote || !state.isOnline) {
    console.log('Using local DB');
    return state.couch.pouch;
  } else {
    console.log('Using remote DB');
    return state.couch.couch;
  }
  */
}

export function isString(t: string | any): t is string {
  return typeof t === 'string';
}
