import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { action, autorun, computed, configure as mobxConfigure, observable, runInAction} from 'mobx';
import * as R from 'ramda';

import * as Couch from './lib/couch';
import * as firestore from './lib/firestore';
import * as Txns from './lib/txns';
import * as Types from './lib/types';

mobxConfigure({ enforceActions: true });

/* tslint:disable:no-console */

class Store {
  @observable public email: string | null = null;
  @observable public txns: Map<string,Txns.Txn> = new Map();
  @observable public db: firebase.firestore.DocumentReference | null = null;
  @observable public visibleTxns: Txns.Txn[] = [];

  public dbC: PouchDB.Database;
  public remoteDB?: PouchDB.Database;
  public pouchReplicator?: PouchDB.Replication.Sync<{}> = undefined;
  @observable public username: string | null = null;

  public firestoreSnapshots: Map<string, () => void> = new Map();

  public visibleTxnsFirst: firebase.firestore.QueryDocumentSnapshot | null = null;
  public visibleTxnsLast: firebase.firestore.QueryDocumentSnapshot | null = null;

  constructor(local: PouchDB.Database) {
    autorun(() => {
      if (!this.loggedIn) {
        Object.values(this.firestoreSnapshots).
        forEach((unsubscriber) => unsubscriber());
      }
    });

    autorun(async () => {
      if (this.username) {
        console.log('Logged in')
        this.remoteDB = await Couch.mkRemoteDB(this.username);
        this.pouchReplicator = Couch.syncDBs(this.dbC, this.remoteDB!);
      } else {
        this.remoteDB = undefined;
        if (this.pouchReplicator) this.pouchReplicator.cancel();
      }
    });

    this.dbC = local;
  }

  public async init() {
    const session = await Couch.getSession();
    if (session.userCtx.name === null) {
      console.log('No user session');
      return;
    }
    this.remoteDB = Couch.mkRemoteDB(session.userCtx.name);
    runInAction(() => {
      console.log();
      this.username = session.userCtx.name;
    });
    await this.subscribeTxns();
  }

  @computed
  get loggedIn(): boolean {
    return Boolean(this.username);
  }

  @computed
  get accounts(): Map<string, Types.Account> {
    const all: string[][] =
      Object.values(this.txns).
      filter(Txns.touchesBank).
      map((txn) => {
        if (Txns.isBankTxn(txn)) {
          return [txn.account];
        } else if (Txns.isAccountTxfr(txn)) {
          return [txn.from, txn.to];
        }
        const n: never = txn;
        return n;
      });

    return new Map(
      R.uniq(R.flatten<string>(all)).
      map((name): [string, Types.Account] => [name, {name}])
    );
  }

  @computed
  get categories(): Map<string, Types.Category> {
    return (
      new Map(
        R.uniq(R.flatten<string>(
          Object.values(this.txns).
          filter(Txns.hasCategories).
          map((txn) => {
            if (Txns.isBankTxn(txn)) {
              return Object.keys(txn.categories);
            } else if (Txns.isEnvelopeTxfr(txn)) {
              return [txn.from, txn.to];
            }
            const n: never = txn;
            return n;
          })
        )).
        map((name): [string, Types.Category] => [name, {name}])
      )
    );
  }

  @computed
  get categoryBalances(): Map<string, Types.Balance> {
    const ledger = R.flatten<Txns.TxnItem>(
      Array.from(this.txns.values()).
        filter(Txns.hasCategories).
        map(Txns.categoriesForTxn)
    );
    const groups = R.groupBy(
      (txnItem) => txnItem.account,
      ledger
    );

    const totals =
      Object.entries(groups).
      map(([account, txnItems]): [string, Types.Balance] => 
        [
          account,
          {name: account, balance: txnItems.map(R.prop('amount')).reduce(R.add)}
        ]
      );
    return new Map(totals);
  }

  @computed
  get bankBalances(): Map<string, Types.Balance> {
    const groups = R.groupBy(
      (txnItem) => txnItem.account,
      Txns.journalToLedger(Array.from(this.txns.values()))
    );
    const totals =
      Object.entries(groups).
      map(([account, txnItems]): [string, Types.Balance] => 
        [
          account,
          {name: account, balance: txnItems.map(R.prop('amount')).reduce(R.add)}
        ]
      );
    return new Map(totals);
  }

  @action
  public setUsername(email: string | null) {
    this.email = email;
  }

  public setTxn(doc: Txns.Txn) {
    this.txns.set(doc._id, doc);
  }

  public removeTxn(doc: Txns.Txn) {
    this.txns.delete(doc._id);
  }

  @action
  public setDB(db: firebase.firestore.DocumentReference) {
    this.db = db;
  }

  public async subscribeTxns() {
    const subscription = (this.dbC as any).liveFind({
      selector: {
        "$or": [
          {type: 'banktxn'},
          {type: 'accountTransfer'},
          {type: 'envelopeTransfer'},
        ]
      }
    });

    subscription.on('update', action(({action: couchAction, doc}) => {
      if (couchAction === 'ADD') return this.setTxn(doc);
      if (couchAction === 'UPDATE') return this.setTxn(doc);
      if (couchAction === 'REMOVE') return this.removeTxn(doc);
    }));
    subscription.on('error', console.error);
  }

  public async logIn(username: string, password: string) {
    console.log('Logging in');
    const remote = await Couch.mkRemoteDB(username);
    await Couch.logIn(remote, username, password);
    const session = await remote.getSession();
    console.log('Login successful');
    runInAction(() => {
      this.username = session.userCtx.name;
    });
    this.dbC = Couch.mkLocalDB();  // Covers recreating the DB after a logout destroys it
    this.remoteDB = remote;
    Couch.syncDBs(this.dbC, remote);
  }

  public async logOut() {
    console.log('Logging out...');
    if (this.remoteDB) {
      await Couch.logOut(this.remoteDB);
      console.log('Logged out from CouchDB');
    }
    await this.dbC.destroy();
    runInAction(() => {
      this.username = null;
    });
  }

  public loadTxnsNextPage() {
    // the ZZZ string represents a value that will always come after any date,
    // so when txns are sorted desc, it'll always return the first item of the
    // first page
    this.loadTxnsPage(this.visibleTxnsLast || 'ZZZZZZZ', 'next');
  }

  public loadTxnsPrevPage() {
    this.loadTxnsPage(this.visibleTxnsFirst, 'prev');
  }

  private loadTxnsPage(
    sentinelDoc: firebase.firestore.QueryDocumentSnapshot | string | null,
    direction: 'prev' | 'next'
  ) {
    // Remove our existing listen hook for any previous queries
    const snapshotKey = 'txnslist';
    if (!this.db) {
      console.log('DB was not initialized, cannot load transactions');
      return;
    }
    const unsubscriber = this.firestoreSnapshots.get(snapshotKey)
    if (unsubscriber) {
      unsubscriber();
      this.firestoreSnapshots.delete(snapshotKey);
    }

    if (sentinelDoc && typeof sentinelDoc !== 'string') {
      const data = sentinelDoc.data()!;
      console.log(data.payee, data.date.toDate(), direction);
    }
    if (!sentinelDoc) console.log('Sentinel was null');

    this.firestoreSnapshots.set(
      snapshotKey,
      firestore.listTxns(
        this.db,
        sentinelDoc,
        direction,
        (docs) => {
          console.log('Got snapshot');
          action(() => {
            if (docs.length === 0) return;  // Otherwise we show an empty table
            this.visibleTxns = docs.map((doc) => doc.data() as Txns.Txn);
            this.visibleTxnsFirst = R.head(docs) || null;
            this.visibleTxnsLast = R.last(docs) || null;
          })();
        }
      )
    );
  }
}

const localDB = Couch.mkLocalDB();
const store = new Store(localDB);
store.init();
export default store;

(window as any).stuff = Couch.getSession();
