import {debounce, fromPairs} from 'lodash';
import Vue from 'vue';
import {Module, Store} from 'vuex';

import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import {activeDB} from '../lib/utils';
import * as Types from './types';

import Amount from '../lib/Amount';
import Category from '../lib/Category';

(window as any).Txns = Txns;

/* tslint:disable:no-console */

let changesAccounts: any | null = null;
let changesCategories: any | null = null;
let changesAccountsBalances: PouchDB.Core.Changes<any> | null = null;
let changesCategoriesBalances: PouchDB.Core.Changes<any> | null = null;

const module: Module<Types.TxnsState, Types.RootState & {couch?: Types.CouchState}> = {
  namespaced: true,

  state: {
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
      return Object.entries(state.accountBalances).
        map(([name, balance]) => {
          if (state.accounts[name]) return {balance, name: state.accounts[name].name};
          return {name, balance};
        });
    },

    categoryBalances(state) {
      return Object.entries(state.categoryBalances).
        map(([name, balance]) => {
          if (state.categories[name]) return {balance, name: state.categories[name].name};
          return {name, balance};
        });
    },

    categories(state) {
      return fromPairs(
        Object.entries(state.categories).
        map(([_key, categoryPojo]) => {
          const balance = state.categoryBalances[categoryPojo.name];
          const cat2 = Category.POJO(categoryPojo, Amount.Pennies(balance || 0));
          return [cat2.id, cat2] as [string, Category];
        }),
      );
    },
  },

  mutations: {
    setAccounts(state, values: Txns.Account[]) {
      state.accounts = {};
      values.forEach((doc) => {
        Vue.set(state.accounts, doc._id, doc);
      });
    },

    setCategories(state, values: Txns.Category[]) {
      state.categories = {};
      values.forEach((doc) => {
        Vue.set(state.categories, doc._id, doc);
      });
    },

    accountBalances(state, balances: Txns.Balance[]) {
      state.accountBalances = {};
      balances.forEach((balance) =>
        Vue.set(state.accountBalances, balance.name, balance.balance),
      );
    },

    categoryBalances(state, balances: Txns.Balance[]) {
      state.categoryBalances = {};
      balances.forEach((balance) =>
        Vue.set(state.categoryBalances, balance.name, balance.balance),
      );
    },
  },

  actions: {
    async init() {
      watch(this as any);
    },

    async watchAccounts({commit}, db: PouchDB.Database) {
      if (changesAccounts && changesAccounts.status !== 'cancelled') changesAccounts.cancel();
      changesAccounts = await Couch.watchSelector(
        db,
        {
          _id: {
            $gte: 'account/',
            $lte: 'account/\uffff',
          },
        },
        (accounts) => commit('setAccounts', accounts),
      );
    },

    async watchCategories({commit}, db: PouchDB.Database) {
      if (changesCategories && changesCategories.status !== 'cancelled') changesCategories.cancel();
      changesCategories = await Couch.watchSelector(
        db,
        {
          _id: {
            $gte: 'category/',
            $lte: 'category/\uffff',
          },
        },
        (categories) => commit('setCategories', categories),
      );
    },

    async subscribeBalances({commit}, db: PouchDB.Database) {
      await Couch.getAccountBalances(db).then((balances) => commit('accountBalances', balances));
      await Couch.getCategoryBalances(db).then((balances) => commit('categoryBalances', balances));

      if (changesAccountsBalances) changesAccountsBalances.cancel();
      if (changesCategoriesBalances) changesCategoriesBalances.cancel();

      changesAccountsBalances = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'accountTransfer'},
          {_deleted: true},
        ]},
      });
      changesCategoriesBalances = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'envelopeTransfer'},
          {_deleted: true},
        ]},
      });

      changesAccountsBalances.on(
        'change',
        debounce(
          () => Couch.getAccountBalances(db).then((balances) => commit('accountBalances', balances)),
          1000,
          {trailing: true},
        ),
      );
      changesAccountsBalances.on('error', console.error);

      changesCategoriesBalances.on(
        'change',
        debounce(
          () => Couch.getCategoryBalances(db).then((balance) => commit('categoryBalances', balance)),
          1000,
          {trailing: true},
        ),
      );
      changesCategoriesBalances.on('error', console.error);
    },
  },
};

export default module;

function watch(store: Store<Types.RootState & {couch: Types.CouchState, txns: Types.TxnsState}>) {
  console.log('Initializing txn watchers');

  store.watch(
    (state: Types.RootState & {couch: Types.CouchState}) => activeDB(state),
    (pouch: PouchDB.Database) =>
      store.dispatch('txns/subscribeBalances', pouch),
    {immediate: true},
  );

  store.watch(
    (state: Types.RootState & {couch: Types.CouchState}) => activeDB(state),
    (pouch: PouchDB.Database) =>
      store.dispatch('txns/watchAccounts', pouch),
    {immediate: true},
  );

  store.watch(
    (state: Types.RootState & {couch: Types.CouchState}) => activeDB(state),
    (pouch: PouchDB.Database) =>
      store.dispatch('txns/watchCategories', pouch),
    {immediate: true},
  );
}
