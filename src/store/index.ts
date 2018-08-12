import constant from 'lodash/fp/constant';
import pipe from 'lodash/fp/pipe';
import {then} from 'pipeable-promises';
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
    syncing: false,
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

    setSyncing(state, syncing) {
      state.syncing = syncing;
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

function mkStore() {
  return pipe(
    then(() => store.dispatch('txns/init')),
    then(constant(store)),
  )(store.dispatch('couch/init'));
}

CouchWatchers.forEach(({getter, handler, immediate}) =>
  store.watch(getter, handler(store), {immediate}));

(window as any).store = store;

export default mkStore;
