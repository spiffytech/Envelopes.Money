import Vue from 'vue';
import Vuex from 'vuex';

import Accounts from './accounts';
import Transactions from './transactions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isAuthed: false,
    userId: null as string | null,
  },
  mutations: {
    setAuth(state, isAuthed: boolean) {
      state.isAuthed = isAuthed;
    },

    setUserId(state, userId: string | null) {
      state.userId = userId;
    },
  },
  actions: {
    logout(context) {
      context.commit('setAuth', false);
      context.commit('setUserId', null);
      window.location.href = '/login';
    },
  },

  modules: {
    accounts: Accounts,
    transactions: Transactions,
  },
});
