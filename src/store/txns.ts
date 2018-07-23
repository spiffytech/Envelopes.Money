import {debounce, partial} from 'lodash';
import fromPairs from 'lodash/fp/fromPairs';
import getOr from 'lodash/fp/getOr';
import Vue from 'vue';
import {Module, Store} from 'vuex';

import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import * as Types from './types';

(window as any).Txns = Txns;

/* tslint:disable:no-console */

let changesAccounts: PouchDB.Core.Changes<any> | null = null;
let changesCategories: PouchDB.Core.Changes<any> | null = null;
let txnsSubscription: any | null = null;

const module: Module<Types.TxnsState, Types.RootState & {couch?: Types.CouchState}> = {
  namespaced: true,

  state: {
    txns: {},
    accounts: {},
    categories: {},
    accountBalances: {},
    categoryBalances: {},
    visibleTxns: 3,
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

    txns(state): Txns.TxnFriendly[] {
      return (
        Object.values(state.txns).
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
    addVisibleTxns(state, n = 30) {
      state.visibleTxns = state.visibleTxns + n;
    },

    setTxns(state, values: Txns.Txn[]) {
      state.txns = {};
      values.map((doc) => Vue.set(state.txns, doc._id, doc));
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

      await Couch.liveFind<Txns.Category>(
        rootState.couch!.pouch,
        {
          selector: {
            type: 'category',
          },
        },
        (values) => commit('handleCategoryUpdates', values),
      );

      watch(this as any);
    },

    async subscribeTxns({commit, state}, {db}: {db: PouchDB.Database}) {
      await Couch.getTxns(db, state.visibleTxns).map(partial(commit, 'setTxns')).promise();

      if (txnsSubscription) return;

      txnsSubscription = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'accountTransfer'},
          {type: 'envelopeTransfer'},
          {_deleted: true},
        ]},
      });
      txnsSubscription.on(
        'change',
        // We use debounce because multiple refleshes get going at once and
        // finish out of order
        debounce(
          () => Couch.getTxns(db, state.visibleTxns).map(partial(commit, 'setTxns')).promise(),
          1000,
          {trailing: true},
        ),
      );
      txnsSubscription.on('error', console.error);
    },

    async subscribeBalances({commit}, db: PouchDB.Database) {
      await Couch.getAccountBalances(db).then(partial(commit, 'accountBalances'));
      await Couch.getCategoryBalances(db).then(partial(commit, 'categoryBalances'));

      if (changesAccounts) changesAccounts.cancel();
      if (changesCategories) changesCategories.cancel();

      changesAccounts = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'accountTransfer'},
          {_deleted: true},
        ]},
      });
      changesCategories = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'envelopeTransfer'},
          {_deleted: true},
        ]},
      });

      changesAccounts.on(
        'change',
        debounce(
          () => Couch.getAccountBalances(db).then(partial(commit, 'accountBalances')),
          1000,
          {trailing: true},
        ),
      );
      changesAccounts.on('error', console.error);

      changesCategories.on(
        'change',
        debounce(
          () => Couch.getCategoryBalances(db).then(partial(commit, 'categoryBalances')),
          1000,
          {trailing: true},
        ),
      );
      changesCategories.on('error', console.error);
    },
  },
};

export default module;

function watch(store: Store<Types.RootState & {couch: Types.CouchState, txns: Types.TxnsState}>) {
  console.log('Initializing txn watchers');

  store.watch(
    (state: Types.RootState & {couch: Types.CouchState}) => state.couch.pouch,
    (pouch: PouchDB.Database) =>
      store.dispatch('txns/subscribeBalances', pouch),
    {immediate: true},
  );

  store.watch(
    (
      state: Types.RootState & {couch: Types.CouchState, txns: Types.TxnsState},
    ) => [state.couch.pouch, state.txns.visibleTxns] as [PouchDB.Database, number],
    ([pouch, _visibleTxns]: [PouchDB.Database, number]) =>
      store.dispatch('txns/subscribeTxns', {db: pouch}),
    {immediate: true},
  );
}
