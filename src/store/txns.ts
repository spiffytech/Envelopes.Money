import * as kefir from 'kefir';
import {partial, throttle} from 'lodash';
import fromPairs from 'lodash/fp/fromPairs';
import getOr from 'lodash/fp/getOr';
import Vue from 'vue';
import {Module, Store} from 'vuex';

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
    accountBalances: {},
    categoryBalances: {},
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
            const categories = fromPairs(
              Object.entries(txn.categories).
              map(([category, balance]) =>
                [getOr(category, 'name', state.categories[category]), balance] as [string, Txns.Pennies],
              ),
            );
            return {
              ...txn,
              accountName: getOr(txn.account, 'name', state.accounts[txn.account]),
              categoryNames: categories,
            };
          } else if (Txns.isAccountTxfr(txn)) {
            return {
              ...txn,
              fromName: getOr(txn.from, 'name', state.accounts[txn.from]),
              toName: getOr(txn.to, 'name', state.accounts[txn.to]),
            };
          } else if (Txns.isEnvelopeTxfr(txn)) {
            return {
              ...txn,
              fromName: getOr(txn.from, 'name', state.categories[txn.from]),
              toName: getOr(txn.to, 'name', state.categories[txn.to]),
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

    accountBalances(state, balances: Txns.Balance[]) {
      balances.forEach((balance) =>
        Vue.set(state.accountBalances, balance.name, balance.balance),
      );
    },

    categoryBalances(state, balances: Txns.Balance[]) {
      balances.forEach((balance) =>
        Vue.set(state.categoryBalances, balance.name, balance.balance),
      );
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

    async subscribeBalances({commit}, pouch: PouchDB.Database) {
      const changesAccounts = pouch.changes({
        since: 'now',
        live: true,
        include_docs: true,
        filter: '_view',
        view: 'balances/accounts',
      });
      const changesCategories = pouch.changes({
        since: 'now',
        live: true,
        include_docs: true,
        filter: '_view',
        view: 'balances/categories',
      });

      changesAccounts.on(
        'change',
        throttle(
          () => Couch.getAccountBalances(pouch).then(partial(commit, 'accountBalances')),
          500,
        ),
      );
      changesAccounts.on('error', console.error);

      changesCategories.on(
        'change',
        throttle(
          () => Couch.getAccountBalances(pouch).then(partial(commit, 'categoryBalances')),
          500,
        ),
      );
      changesCategories.on('error', console.error);
    },

    getAccountBalances({commit}, db: PouchDB.Database) {
      return Couch.getAccountBalances(db).then(partial(commit, 'accountBalances'));
    },
    getCategoryBalances({commit}, db: PouchDB.Database) {
      return Couch.getCategoryBalances(db).then(partial(commit, 'categoryBalances'));
    },
  },
};

export default module;

export const watchers = [
  {
    getter: (state: Types.RootState & {couch: Types.CouchState}) => state.couch.pouch,
    handler: (store: Store<Types.RootState>) =>
      (pouch: PouchDB.Database) =>
        store.dispatch('txns/subscribeBalances', pouch),
    immediate: false,
  },
];
