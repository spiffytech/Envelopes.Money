import Vue from 'vue';
import Vuex from 'vuex';

import CouchStore from './couch';
import {watchers as CouchWatchers} from './couch';
import TxnsStore from './txns';
import * as Types from './types';

Vue.use(Vuex);

const store = new Vuex.Store<Types.RootState>({
  state: {
    isOnline: navigator.onLine,
    username: null,
    flash: null,
  },

  getters: {
    loggedIn(state) {
      return state.username !== null;
    },
  },

  mutations: {
    setOnline(state, isOnline) {
      state.isOnline = isOnline;
    },

    setUsername(state, username: string) {
      state.username = username;
    },

    setFlash(state, flash) {
      state.flash = flash;
    },

    clearFlash(state) {
      state.flash = null;
    },
  },
  actions: {

  },

  modules: {
    couch: CouchStore,
    txns: TxnsStore,
  },
});

window.addEventListener('online', () => store.commit('setOnline', true));
window.addEventListener('online', () => store.commit('setOnline', false));

store.dispatch('couch/init').
  then(() => store.dispatch('txns/init')).
  catch(console.error);

CouchWatchers.forEach(({getter, handler, immediate}) =>
  store.watch(getter, handler(store), {immediate}));

(window as any).store = store;

import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import flatten from 'lodash/fp/flatten';
import uniq from 'lodash/fp/uniq';
/* tslint:disable:no-console */
(window as any).discoverCategories = () => {
  const txns = Object.values((store.state as Types.RootState & {txns: Types.TxnsState}).txns.txns);
  const categories =
    uniq(
      flatten<Txns.TxnItem>(
        txns.filter(Txns.hasCategories).
        map(Txns.categoriesForTxn),
      ).
      map(({account}) => account),
    );

  console.log(categories);
  return Promise.all(categories.map((category) =>
    Couch.upsertCategory(
      (store.state as Types.RootState & {couch: Types.CouchState}).couch.pouch,
      {name: category,
        target: 0 as Txns.Pennies,
        interval: 'weekly',
        type: 'category',
        _id: Txns.idForCategoryName(category),
      },
    ),
  ));
};

(window as any).discoverAccounts = () => {
  const txns = Object.values((store.state as Types.RootState & {txns: Types.TxnsState}).txns.txns);
  const accounts = uniq(
    Txns.journalToLedger(txns).
    map((item: Txns.TxnItem) => item.account),
  );

  return Promise.all(accounts.map((account) => {
    Couch.upsertAccount(
      (store.state as Types.RootState & {couch: Types.CouchState}).couch.pouch,
      {
        name: account,
        _id: Txns.idForAccountName(account),
        type: 'account',
      },
    );
  }));
};

export default store;
