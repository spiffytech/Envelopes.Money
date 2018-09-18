/* tslint:disable:no-console */

/* tslint:disable-next-line:no-var-requires */
const format = require('date-fns').format;

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
  return format(date, 'YYYY-MM-DD');
}

export function activeDB(state: StoreTypes.RootState & {couch: StoreTypes.CouchState}) {
  // if (state.couch.inSync || !state.couch.canTalkToRemote || !state.isOnline || !state.couch.couch) {
  if (!state.couch.canTalkToRemote || !state.isOnline || !state.couch.couch) {
    console.log('Using local DB');
    return state.couch.pouch;
  } else {
    console.log('Using remote DB');
    return state.couch.couch;
  }
}

export function txnFromPOJO(txn: Txns.Txn): Types.Txn {
  if (txn.type === 'accountTransfer') return AccountTransfer.POJO(txn);
  else if (txn.type === 'banktxn') return BankTxn.POJO(txn);
  else if (txn.type === 'envelopeTransfer') return EnvelopeTransfer.POJO(txn);
  else throw new Error(`Invalid txn type ${(txn as any).type}`);
}

export function isString(t: string | any): t is string {
  return typeof t === 'string';
}
