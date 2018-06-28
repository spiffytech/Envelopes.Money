import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { action, autorun, computed, configure as mobxConfigure, observable, set as mobxSet} from 'mobx';
import * as R from 'ramda';

import * as firestore from './lib/firestore';
import * as Txns from './lib/txns';
import * as Types from './lib/types';

mobxConfigure({ enforceActions: true });

/* tslint:disable:no-console */

class Store {
  @observable public accounts: {[key: string]: Types.Balance} = {};
  @observable public categories: {[key: string]: Types.Category} = {};
  @observable public email: string | null = null;
  @observable public txns: Txns.Txn[] = [];
  @observable public db: firebase.firestore.DocumentReference | null = null;
  @observable public visibleTxns: Txns.Txn[] = [];

  public firestoreSnapshots: Map<string, () => void> = new Map();

  public visibleTxnsFirst: firebase.firestore.QueryDocumentSnapshot | null = null;
  public visibleTxnsLast: firebase.firestore.QueryDocumentSnapshot | null = null;

  constructor() {
    autorun(() => {
      if (!this.loggedIn) {
        Object.values(this.firestoreSnapshots).
        forEach((unsubscriber) => unsubscriber());
      }
    });
  }

  @computed
  get categoryBalances(): Map<string, Types.Balance> {
    return new Map(
      Object.entries(this.categories).
      map(([accountName, category]) => [accountName, category] as [string, Types.Balance])
    );
  }

  @computed
  get bankBalances(): Map<string, Types.Balance> {
    return new Map(
      Object.entries(this.accounts).
      map(([accountName, account]) => [accountName, account] as [string, Types.Balance])
    );
  }

  @computed
  get loggedIn() {
    return Boolean(this.email)
  }

  @action
  public setUsername(email: string | null) {
    this.email = email;
  }

  @action
  public setAccounts(accounts: Types.Balance[]) {
    mobxSet(this.accounts, {});
    accounts.forEach((account) => mobxSet(this.accounts, {[account.name]: account}));
  }

  @action
  public setCategories(accounts: Types.Balance[]) {
    mobxSet(this.categories, {});
    accounts.forEach((category) => mobxSet(this.categories, {[category.name]: category}));
  }

  public clearTxns() {
    this.txns = [];
  }

  public addTxn(doc: Txns.Txn) {
    this.txns.push(doc);
  }

  public addTxns(docs: Txns.Txn[]) {
    this.txns.push(...docs);
  }

  @action
  public setDB(db: firebase.firestore.DocumentReference) {
    this.db = db;
  }

  public async logIn({email}: {email: string}) {
    // This is for if the user signs in on a different device than from
    // which the requested the email link, and we don't have their email in
    // local storage

    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
      return this.tryFinishLogIn();
    }

    const options = {
      // This must be true.
      handleCodeInApp: true,
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be whitelisted in the Firebase Console.
      url: `${process.env.REACT_APP_DOMAIN}/login`,
    }
    await firebase.auth().sendSignInLinkToEmail(email, options);
    localStorage.setItem('emailForSignIn', email); // Will be verified in second half of login
  }

  public logOut() {
    return firebase.auth().signOut();
  }

  public async tryFinishLogIn() {
    if (!firebase.auth().isSignInWithEmailLink(window.location.href)) {
      console.log('Not a link for finishing a login');
      return;
    }

    const email = localStorage.getItem('emailForSignIn');
    
    /* tslint:disable-next-line:curly */
    if (!email) throw new Error('Email is not stored in localStorage');

    await firebase.auth().signInWithEmailLink(
      email, window.location.href
    );
    localStorage.removeItem('emailForSignIn');
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

const store = new Store();
export default store;

// let txnWatchUnsubscribe: (() => void) | null = null;

firebase.auth().onAuthStateChanged(async (user) => {
  try {
    await firebase.firestore().enablePersistence();
  } catch(ex) {
    console.error(ex);
  }

  store.setUsername(user ? user.email : null)

  const u = firebase.auth().currentUser;
  if (u) {
    /* tslint:disable-next-line */
    const db = firebase.firestore().collection('users').doc(u.email!);
    store.setDB(db);

    // txnWatchUnsubscribe = firestore.watchTransactions(db, store);
    store.firestoreSnapshots.set(
      'accountWatch',
      firestore.watch(db.collection('accounts'), store.setAccounts.bind(store))
    );

    store.firestoreSnapshots.set(
      'categoryWatch',
      firestore.watch(db.collection('categories'), store.setCategories.bind(store))
    );
  } else {
    /* tslint:disable:curly */
    // if (txnWatchUnsubscribe) txnWatchUnsubscribe();
    /* tslint:enable:curly */
  }
});