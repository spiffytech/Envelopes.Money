import * as Txns from '../lib/txns';

export interface RootState {
  isOnline: boolean;
  username?: string | null;
  flash: {msg: string, type: 'error' | null} | null;
}

export interface CouchState {
  pouch: PouchDB.Database;
  couch?: PouchDB.Database;
  replicator?: PouchDB.Replication.Sync<{}>;
}

export interface TxnsState {
  txns: {[key: string]: Txns.Txn};
  accounts: {[key: string]: Txns.Account};
  categories: {[key: string]: Txns.Category};
}
