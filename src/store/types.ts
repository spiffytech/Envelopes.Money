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
}

export interface TxnsState {
  txns: {[key: string]: Txns.Txn};
  accounts: {[key: string]: Txns.Account};
  categories: {[key: string]: Txns.Category};
  accountBalances: {[key: string]: Txns.Balance};
  categoryBalances: {[key: string]: Txns.Balance};
  visibleTxns: number;
}

export interface CommitSetSyncing {
  type: 'setSyncing';
  value: boolean;
}

export interface CommitSetFlash {
  type: 'setFlash';
  value: RootState['flash'];
}

export type Action = CommitSetFlash | CommitSetFlash;
