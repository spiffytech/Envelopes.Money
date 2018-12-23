import Vue from 'vue';

import axios from 'axios';
import {Module} from 'vuex';
import * as CommonTypes from '../../../common/lib/types';
import {endpoint} from '@/lib/config';

interface ModuleState {
  transactions: {[id: string]: CommonTypes.TxnTuple};
}

const module: Module<ModuleState, any> = {
  namespaced: true,

  getters: {
    transactions(state) {
      console.log(state.transactions);
      return Object.values(state.transactions).sort((a, b) => {
        return a.transaction.date < b.transaction.date ? 1 : -1;
      });
    },
  },

  state: {
    transactions: {},
  },

  mutations: {
    addTransactions(state, transactions: CommonTypes.TxnTuple[]) {
      transactions.forEach((txn) =>
        Vue.set(state.transactions, txn.transaction.id, txn)
      );
    },
  },

  actions: {
    async load(context) {
      const result = await axios.get(`${endpoint}/api/transactions`);
      context.commit('addTransactions', result.data);
    },
  },
};

export default module;
