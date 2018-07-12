import {Module} from 'vuex';

import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import * as Types from './types';

const module: Module<Types.TxnsState, Types.RootState & {couch?: Types.CouchState}> = {
  namespaced: true,

  state: {
    txns: {},
  },

  getters: {
    categoryBalances(state) {
      return Txns.categoryBalances(Object.values(state.txns));
    },
  },

  mutations: {
    handleTxnUpdates(state, values: Array<Couch.LiveFindValue<Txns.Txn>>) {
      values.map(({action: couchAction, doc}) => {
        if (couchAction === 'ADD') return Vue.set(state.txns, doc._id, doc);
        if (couchAction === 'UPDATE') return Vue.set(state.txns, doc._id, doc);
        if (couchAction === 'REMOVE') return Vue.delete(state.txns, doc._id);
      });
    },
  },

  actions: {
    async init({commit, rootState}) {
      await Couch.liveFind<Txns.Txn>(
        rootState.couch!.pouch,
        {
          selector: {
            $or: [
              {type: 'banktxn'},
              {type: 'accountTransfer'},
              {type: 'envelopeTransfer'},
            ],
          },
        },
        (values) => commit('handleTxnUpdates', values),
      );
    },
  },
};

export default module;
