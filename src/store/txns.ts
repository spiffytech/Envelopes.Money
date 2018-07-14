import * as _ from 'lodash';
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
      console.log(state.accounts);
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
                [_.get(state.categories[category], 'name', category), balance] as [string, Txns.Pennies],
              ),
            );
            return {
              ...txn,
              accountName: _.get(state.accounts[txn.account], 'name', txn.account),
              categoryNames: categories,
            };
          } else if (Txns.isAccountTxfr(txn)) {
            return {
              ...txn,
              fromName: _.get(state.accounts[txn.from], 'name', txn.from),
              toName: _.get(state.accounts[txn.to], 'name', txn.to),
            };
          } else if (Txns.isEnvelopeTxfr(txn)) {
            return {
              ...txn,
              fromName: _.get(state.categories[txn.from], 'name', txn.from),
              toName: _.get(state.categories[txn.to], 'name', txn.to),
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
      await Couch.liveFind<Txns.Category>(
        rootState.couch!.pouch,
        {
          selector: {
            type: 'category',
          },
        },
        (values) => commit('handleCategoryUpdates', values),
      );

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
    },
  },
};

export default module;
