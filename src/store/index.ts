import Vue from 'vue';
import Vuex from 'vuex';

import CouchStore from './couch';
import {watchers as CouchWatchers} from './couch';
import * as Types from './types';

Vue.use(Vuex);

const store = new Vuex.Store<Types.RootState>({
  state: {
    isOnline: navigator.onLine,
    username: null,
  },
  mutations: {
    setOnline(state, isOnline) {
      state.isOnline = isOnline;
    },

    setUsername(state, username: string) {
      state.username = username;
    },
  },
  actions: {

  },
  modules: {
    couch: CouchStore,
  },
});

window.addEventListener('online', () => store.commit('setOnline', true));
window.addEventListener('online', () => store.commit('setOnline', false));

store.dispatch('couch/init').then(console.log).catch(console.error);

CouchWatchers.forEach(({getter, handler}) => store.watch(getter, handler(store), {immediate: true}));

(window as any).store = store;
/* tslint:disable:no-console */
console.log('here');

export default store;
