import axios from 'axios';
import {Module} from 'vuex';
import * as CommonTypes from '../../../common/lib/types';
import {endpoint} from '@/lib/config';

interface ModuleState {
  transactions: {[id: string]: CommonTypes.ITransaction};
}

const module: Module<ModuleState, any> = {
  state: {
    transactions: {},
  },

  mutations: {
    addTransactions(state, transactions: CommonTypes.ITransaction[]) {
      transactions.forEach((txn) => state.transactions[txn.id] = txn);
    },
  },

  actions: {
    async loadTransactions(context) {
      const result = await axios.get(`${endpoint}/api/transactions`);
      context.commit('addTransactions', result.data);
    },
  },
};

export default module;
