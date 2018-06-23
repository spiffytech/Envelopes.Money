import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { action, computed, configure as mobxConfigure, extendObservable, observable } from 'mobx';
import * as R from 'ramda';

import * as Categories from './lib/categories';
import * as Txns from './lib/txns';

mobxConfigure({ enforceActions: true });

/* tslint:disable:no-console */

const isBankAccount =
  R.curry(
    (bankAccounts: { [key: string]: any }, txnItem: Txns.TxnItem): boolean => {
      console.log(Object.keys(bankAccounts), txnItem.account);
      return Object.keys(bankAccounts).indexOf(txnItem.account) !== -1;
    }
  );
class Store {
  @observable public categories = [];
  @observable public email: string | null = null;
  @observable public txns: Txns.DETxn[] = [];
  @observable public bankAccounts: { [key: string]: any } = {};

  @computed
  get categoryBalances(): Map<string, Categories.CategoryBalance> {
    return new Map(
      Txns.calcBalances(this.txns, R.complement(isBankAccount(this.bankAccounts))).
      map((balanceItem) =>
        [balanceItem.account, balanceItem] as [string, Categories.CategoryBalance]
      )
    );
  }

  @computed
  get accountBalances(): Array<{account: string, balance: number}> {
    return Txns.calcBalances(this.txns, isBankAccount(this.bankAccounts));
  }

  @computed
  get loggedIn() {
    return Boolean(this.email)
  }

  @action
  public setUsername(email: string | null) {
    this.email = email;
  }

  public clearTxns() {
    this.txns = [];
  }

  public addTxn(doc: Txns.DETxn) {
    this.txns.push(doc);
  }

  public addTxns(docs: Txns.DETxn[]) {
    this.txns.push(...docs);
  }

  public setBankAccounts(accounts: {[key: string]: any}) {
    extendObservable(this.bankAccounts, accounts);
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
}

const store = new Store();
export default store;

/* tslint:disable:no-var-requires */
const firebaseConfig = require('./firebase.config.json');
/* tslint:enable:no-var-requires */
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({timestampsInSnapshots: true});

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

    db.collection('txns').
    orderBy('date', 'desc').
    onSnapshot((snapshot) => {
      console.log('Snapshots came from cache?', snapshot.metadata.fromCache);
      store.clearTxns();
      const docs = snapshot.docs.map((doc) => doc.data());
      store.addTxns(docs as Txns.DETxn[]);
      console.log('Adding docs', docs.length)
    });

    db.
    onSnapshot((snapshot) => {
      /* tslint:disable */
      store.setBankAccounts(snapshot.data()!.bankAccounts);
      /* tslint:enable */
    });
  }
});