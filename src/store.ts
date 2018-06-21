import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import router from './router';
import {BankEvent, sumAccountTotal} from './lib/txns';
import * as Categories from './lib/categories';
import * as utils from './lib/utils';

const firebaseConfig = require('../firebase.config.json');

firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({timestampsInSnapshots: true});

interface State {
  categories: Categories.Category[],
  email: string | null;
  txns: BankEvent[];
}

const store = new Vuex.Store<State>({
    state: {
      categories: [],
      email: null,
      txns: [],
    },

    getters: {
      categoriesFromTxns(state): string[] {
        return Categories.discoverCategories(state.txns);
      },

      categoryBalances(state): Map<string, Categories.CategoryBalance> {
        const categories = state.categories;
        return Categories.calcBalances(categories, state.txns);
      },

      loggedIn(state) {
        return Boolean(state.email)
      },

      accountBalances(state): {account: string, balance: number}[] {
        const groups = utils.groupBy(state.txns.filter((txn) => txn.account), ((txn) => txn.account));
        return Object.entries(groups).map(([account, txns]) => ({
          account: account,
          balance: sumAccountTotal(txns)
        }));
      }
    },

    mutations: {
      setUsername(state, email: string) {
        state.email = email;
      },

      clearTxns(state) {
        state.txns = [];
      },

      addTxn(state, doc: BankEvent) {
        state.txns.push(doc);
      },

      addTxns(state, docs: BankEvent[]) {
        state.txns.push(...docs);
      },

      setCategories(state, categories) {
        state.categories = categories;
      },
    },

    actions: {
      async logIn({dispatch}, {email}: {email: string}) {
        // This is for if the user signs in on a different device than from
        // which the requested the email link, and we don't have their email in
        // local storage

        if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
          return dispatch('tryFinishLogin');
        }

        const options = {
          // URL you want to redirect back to. The domain (www.example.com) for this
          // URL must be whitelisted in the Firebase Console.
          url: `${process.env.VUE_APP_DOMAIN}/login`,
          // This must be true.
          handleCodeInApp: true,
        }
        await firebase.auth().sendSignInLinkToEmail(email, options);
        localStorage.setItem('emailForSignIn', email); // Will be verified in second half of login
      },

      logOut() {
        return firebase.auth().signOut();
      },

      async tryFinishLogIn() {
        if (!firebase.auth().isSignInWithEmailLink(window.location.href)) {
          return;
        }

        const email = localStorage.getItem('emailForSignIn');
        if (!email) throw new Error('Email is not stored in localStorage');

        await firebase.auth().signInWithEmailLink(
          email, window.location.href
        );
        localStorage.removeItem('emailForSignIn');

        router.push('/');
      },
    }
});

firebase.auth().onAuthStateChanged(async (user) => {
  await firebase.firestore().enablePersistence();

  store.commit('setUsername', user ? user.email : null)

  const u = firebase.auth().currentUser;
  if (u) {
    const db = firebase.firestore().collection('users').doc(u.email!);

    db.collection('txns').
    orderBy('date', 'desc').
    onSnapshot((snapshot) => {
      console.log('Snapshots came from cache?', snapshot.metadata.fromCache);
      store.commit('clearTxns');
      const docs = snapshot.docs.map((doc) => doc.data());
      store.commit('addTxns', docs);
      console.log('Adding docs', docs.length)
    });

    db.collection('categories').
    orderBy('sortOrder').
    onSnapshot((snapshot) => {
      store.commit('setCategories', snapshot.docs.map((doc) => doc.data()));
    });
  }
});

(window as any).store = store;

export default store;