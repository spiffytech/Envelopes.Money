import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { action, computed, configure as mobxConfigure, observable, set as mobxSet} from 'mobx';
import * as R from 'ramda';

import * as firestore from './lib/firestore';
import * as Txns from './lib/txns';
import * as Types from './lib/types';

mobxConfigure({ enforceActions: true });

/* tslint:disable:no-console */

const isBankAccount = R.pipe(R.unary(R.prop('isBankAccount')), Boolean);

function balances(accounts: {[key: string]: Types.Account}, pred: (account: Types.Account) => boolean) {
  return new Map(
    Object.values(accounts).
    filter(pred).
    map((account) => [account.name, account] as [string, Types.Account])
  );
}

class Store {
  @observable public categories = [];
  @observable public email: string | null = null;
  @observable public txns: Txns.DETxn[] = [];
  @observable public accounts: { [key: string]: Types.Account } = {};

  @computed
  get categoryBalances(): Map<string, Types.Account> {
    return balances(this.accounts, R.complement(isBankAccount));
  }

  @computed
  get bankBalances(): Map<string, Types.Account> {
    return balances(this.accounts, isBankAccount);
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
  public setAllAccounts(accounts: Types.Account[]) {
    mobxSet(this.accounts, []);
    accounts.forEach((account) => mobxSet(this.accounts, {[account.name]: account}));
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

let txnWatchUnsubscribe: (() => void) | null = null;
let accountWatchUnsubscribe: (() => void) | null = null;

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

    txnWatchUnsubscribe = firestore.watchTransactions(db, store);
    accountWatchUnsubscribe = firestore.watchAccounts(db, store);
  } else {
    /* tslint:disable:curly */
    if (txnWatchUnsubscribe) txnWatchUnsubscribe();
    if (accountWatchUnsubscribe) accountWatchUnsubscribe();
    /* tslint:enable:curly */
  }
});