/* tslint:disable:no-console */

import format from 'date-fns/format';

import * as StoreTypes from '../store/types';
import * as Txns from './txns';

export function formatCurrency(dollars: Txns.Dollars): string {
  return Intl.NumberFormat(
    navigator.language || 'en-US',
    {minimumIntegerDigits: 1, minimumFractionDigits: 2, maximumFractionDigits: 2},
  ).format(dollars);
}

export function formatDate(date: string | Date): string {
  return format(date, 'YYYY-MM-DD');
}

export function activeDB(state: StoreTypes.RootState & {couch: StoreTypes.CouchState}) {
  if (state.couch.inSync || !state.couch.canTalkToRemote || !state.isOnline || !state.couch.couch) {
    console.log('Using local DB');
    return state.couch.pouch;
  } else {
    console.log('Using remote DB');
    return state.couch.couch;
  }
}
