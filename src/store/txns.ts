import * as R from 'ramda';
import Vue from 'vue';
import {Module} from 'vuex';

import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import * as Types from './types';

(window as any).Txns = Txns;
/* tslint:disable:no-console */

const module: Module<Types.TxnsState, Types.RootState & {couch?: Types.CouchState}> = {
  namespaced: true,

  state: {
    txns: {},
    accounts: {},
    categories: {},
  },

  getters: {
    /**
     * We have to check if they exist because txns are loaded before accounts
     */
    accountBalances(state) {
      return Txns.accountBalances(Object.values(state.txns)).
        map(({name, balance}) => {
          if (state.accounts[name]) return {balance, name: state.accounts[name].name};
          return {balance, name};
        });
    },

    categoryBalances(state) {
      return Txns.categoryBalances(Object.values(state.txns)).
        map(({name, balance}) => {
          if (state.categories[name]) return {balance, name: state.categories[name].name};
          return {balance, name};
        });
    },

    txnsFriendly(state): Txns.TxnFriendly[] {
      return (
        Object.values(state.txns).
        sort((a, b) => new Date(a.date) < new Date(b.date) ? 1 : -1).
        map((txn) => {
          if (Txns.isBankTxn(txn)) {
            const categories = R.fromPairs(
              Object.entries(txn.categories).
              map(([category, balance]) =>
                [R.pathOr(category, ['name'], state.categories[category]), balance] as [string, Txns.Pennies],
              ),
            );
            return {
              ...txn,
              accountName: R.pathOr(txn.account, ['name'], state.accounts[txn.account]),
              categoryNames: categories,
            };
          } else if (Txns.isAccountTxfr(txn)) {
            return {
              ...txn,
              fromName: R.pathOr(txn.from, ['name'], state.accounts[txn.from]),
              toName: R.pathOr(txn.to, ['name'], state.accounts[txn.to]),
            };
          } else if (Txns.isEnvelopeTxfr(txn)) {
            return {
              ...txn,
              fromName: R.pathOr(txn.from, ['name'], state.categories[txn.from]),
              toName: R.pathOr(txn.to, ['name'], state.categories[txn.to]),
            };
          }

          const t: never = txn;
          return t;
        })
      );
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

    handleCategoryUpdates(state, values: Array<Couch.LiveFindValue<Txns.Category>>) {
      values.map(({action: couchAction, doc}) => {
        if (couchAction === 'ADD') return Vue.set(state.categories, doc._id, doc);
        if (couchAction === 'UPDATE') return Vue.set(state.categories, doc._id, doc);
        if (couchAction === 'REMOVE') return Vue.delete(state.categories, doc._id);
      });
    },

    handleAccountUpdates(state, values: Array<Couch.LiveFindValue<Txns.Account>>) {
      values.map(({action: couchAction, doc}) => {
        if (couchAction === 'ADD') return Vue.set(state.accounts, doc._id, doc);
        if (couchAction === 'UPDATE') return Vue.set(state.accounts, doc._id, doc);
        if (couchAction === 'REMOVE') return Vue.delete(state.accounts, doc._id);
      });
    },
  },

  actions: {
    async init({commit, rootState}) {
      await Couch.liveFind<Txns.Account>(
        rootState.couch!.pouch,
        {
          selector: {
            type: 'account',
          },
        },
        (values) => commit('handleAccountUpdates', values),
      );

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

      await Couch.liveFind<Txns.Category>(
        rootState.couch!.pouch,
        {
          selector: {
            type: 'category',
          },
        },
        (values) => commit('handleCategoryUpdates', values),
      );
    },
  },
};

export default module;
