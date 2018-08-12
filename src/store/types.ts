import * as Txns from '../lib/txns';

export interface RootState {
  isOnline: boolean;
  username?: string | null;
  flash: {msg: string, type: 'error' | null} | null;
  syncing: boolean;
}

export interface CouchState {
  pouch: PouchDB.Database;
  couch?: PouchDB.Database;
  replicator?: PouchDB.Replication.Sync<{}>;
  inSync: boolean;
  canTalkToRemote: boolean;
}

export interface TxnsState {
  accounts: {[key: string]: Txns.Account};
  categories: {[key: string]: Txns.Category};
  accountBalances: {[key: string]: Txns.Balance};
  categoryBalances: {[key: string]: Txns.Balance};
}
