import {debounce, partial} from 'lodash';
import fromPairs from 'lodash/fp/fromPairs';
import getOr from 'lodash/fp/getOr';
import Vue from 'vue';
import {Module, Store} from 'vuex';

import * as Couch from '../lib/couch';
import * as Txns from '../lib/txns';
import {activeDB} from '../lib/utils';
import * as Types from './types';

(window as any).Txns = Txns;

/* tslint:disable:no-console */

let changesAccounts: any | null = null;
let changesCategories: any | null = null;
let changesAccountsBalances: PouchDB.Core.Changes<any> | null = null;
let changesCategoriesBalances: PouchDB.Core.Changes<any> | null = null;
let txnsSubscription: any | null = null;

const module: Module<Types.TxnsState, Types.RootState & {couch?: Types.CouchState}> = {
  namespaced: true,

  state: {
    txns: {},
    accounts: {},
    categories: {},
    accountBalances: {},
    categoryBalances: {},
    visibleTxns: 20,
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
                [getOr(category, 'name', state.categories[category]), balance],
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
    addVisibleTxns(state, n: number = 30) {
      const numTxns = Object.keys(state.txns).length;
      state.visibleTxns = Math.min(numTxns + n, state.visibleTxns + n);
    },

    setTxns(state, values: Txns.Txn[]) {
      state.txns = {};
      values.forEach((doc) => Vue.set(state.txns, doc._id, doc));
    },

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
      if (changesAccounts) changesAccounts.cancel();
      changesAccounts = await Couch.watchSelector(
        db,
        {
          _id: {
            $gte: 'account/',
            $lte: 'account/\uffff',
          },
        },
        partial(commit, 'setAccounts'),
      );
    },

    async watchCategories({commit}, db: PouchDB.Database) {
      if (changesCategories) changesCategories.cancel();
      changesCategories = await Couch.watchSelector(
        db,
        {
          _id: {
            $gte: 'category/',
            $lte: 'category/\uffff',
          },
        },
        partial(commit, 'setCategories'),
      );
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
          () => Couch.getAccountBalances(db).then(partial(commit, 'accountBalances')),
          1000,
          {trailing: true},
        ),
      );
      changesAccountsBalances.on('error', console.error);

      changesCategoriesBalances.on(
        'change',
        debounce(
          () => Couch.getCategoryBalances(db).then(partial(commit, 'categoryBalances')),
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

  store.watch(
    (
      state: Types.RootState & {couch: Types.CouchState, txns: Types.TxnsState},
      /* tslint:disable-next-line:no-useless-cast */
    ) => [activeDB(state), state.txns.visibleTxns] as [PouchDB.Database, number],
    ([pouch, _visibleTxns]: [PouchDB.Database, number]) =>
      store.dispatch('txns/subscribeTxns', {db: pouch}),
    {immediate: true},
  );
}
