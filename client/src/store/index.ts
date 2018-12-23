import Vue from 'vue';
import Vuex from 'vuex';

import Accounts from './accounts';
import Transactions from './transactions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isAuthed: false,
  },
  mutations: {
    setAuth(state, isAuthed: boolean) {
      state.isAuthed = isAuthed;
    },
  },
  actions: {

  },

  modules: {
    accounts: Accounts,
    transactions: Transactions,
  },
});
