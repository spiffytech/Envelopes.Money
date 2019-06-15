import ApolloClient from 'apollo-client';
import flatten from 'lodash/flatten';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import tinydate from 'tinydate';
import Vue from 'vue';
import Vuex from 'vuex';

import * as Accounts from './lib/Accounts';
import * as Transactions from './lib/Transactions';
import { Balance, IAccount, TxnGrouped } from './lib/types';

Vue.use(Vuex);

// TODO: Trampoline this because it's going to overflow
function calcDaysInPeriod(
  periodStart: Date,
  days = [] as Date[],
  periodEnd = new Date()
): Date[] {
  // THe extra day is a hack until we figure out storing+parsing dates in a
  // consistent timezone
  if (new Date(periodEnd.getTime() + 86400000) < periodStart) return days;
  const nextDate = new Date(periodStart.getTime() + 86400000);
  return calcDaysInPeriod(nextDate, [...days, periodStart], periodEnd);
}

function calcBalancesForAccount(
  amounts: { accountId: string; date: string; amount: number }[]
): { [date: string]: number } {
  const amountsByDate = groupBy(amounts, 'date');
  const minDate = Math.min(
    ...amounts.map(({ date }) => new Date(date).getTime())
  );
  const dates = calcDaysInPeriod(new Date(minDate));
  const { ret: finalRet } = dates.reduce(
    ({ ret, lastValue }, date) => {
      const dateStr = tinydate('{YYYY}-{MM}-{DD}')(date);
      const newValue =
        lastValue +
        (amountsByDate[dateStr] || []).reduce(
          (acc, item) => acc + item.amount,
          0
        );
      // Using a mutable assignment is much, much faster than spreading this for every single loop through this operation
      ret[dateStr] = newValue;
      return { ret, lastValue: newValue };
    },
    { ret: {} as { [date: string]: number }, lastValue: 0 }
  );

  return finalRet;
}

export default new Vuex.Store({
  getters: {
    accountBalances(state, getters) {
      return getters.balancesByAccountByDay.filter(
        ({ account }: { account: IAccount }) => account.type === 'account'
      );
    },

    envelopeBalances(_state, getters) {
      return getters.balancesByAccountByDay.filter(
        ({ account }: { account: IAccount }) => account.type === 'envelope'
      );
    },

    balancesByAccountByDay(
      state,
      getters
    ): { account: IAccount; balances: { [date: string]: number } }[] {
      const accountIdWithTxnAmount: {
        accountId: string;
        date: string;
        amount: number;
      }[] = flatten(
        (getters.transactions as Transactions.T[]).map(txn => [
          { accountId: txn.from_id, date: txn.date, amount: -txn.amount },
          {
            accountId: txn.to_id,
            date: txn.date,
            amount: txn.amount * (txn.type === 'banktxn' ? -1 : 1)
          }
        ])
      );

      const txnAmountsByAccount = groupBy(accountIdWithTxnAmount, 'accountId');
      const accountBalancesByDay = Object.entries(txnAmountsByAccount).map(
        ([accountId, amounts]) => ({
          account: state.accounts[accountId],
          balances: calcBalancesForAccount(amounts)
        })
      );
      return accountBalancesByDay;
    },

    transactions(state) {
      return Object.values(state.transactions).sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
    },

    txnsGrouped(state) {
      return Object.values(groupBy(Object.values(state.transactions), 'txn_id'))
        .map(
          (txnGroup): TxnGrouped => {
            const toNames = txnGroup.map(txn =>
              state.accounts[txn.to_id]
                ? state.accounts[txn.to_id].name
                : 'unknown'
            );
            const fromName = state.accounts[txnGroup[0].from_id]
              ? state.accounts[txnGroup[0].from_id].name
              : 'unknown';
            return {
              to_names: toNames.join(', '),
              to_ids: txnGroup.map(txn => txn.to_id).join(','),
              amount: txnGroup
                .map(txn => -txn.amount)
                .reduce((acc, item) => acc + item, 0),
              txn_id: txnGroup[0].txn_id,
              user_id: txnGroup[0].user_id,
              label: txnGroup[0].label,
              date: txnGroup[0].date,
              memo: txnGroup[0].memo,
              from_id: txnGroup[0].from_id,
              from_name: fromName,
              type: txnGroup[0].type
            };
          }
        )
        .sort((a, b) => (a.date < b.date ? -1 : 1));
    }
  },
  state: {
    transactions: {} as { [id: string]: Transactions.T },
    accounts: {} as { [id: string]: IAccount }
  },
  mutations: {
    setItems(
      state,
      { storeKey, items }: { storeKey: string; itemKey: string; items: any[] }
    ) {
      items.forEach(item => Vue.set((state as any)[storeKey], item.id, item));
    }
  },
  actions: {
    subscribeAll(
      ctx,
      graphql: {
        userId: string;
        apikey: string;
        apollo: ApolloClient<any>;
      }
    ) {
      /**
       * Subscribes to a given module's data set, updating the supplied store key on
       * every update
       */
      function subscribeModule<T extends object>(
        module: {
          subscribe: (
            graphql: {
              userId: string;
              apikey: string;
              apollo: ApolloClient<any>;
            },
            onData: (data: { data: { [key: string]: T } }) => void
          ) => void;
        },
        storeKey: string,
        dataKey: string
      ) {
        module.subscribe(graphql, ({ data }) => {
          console.log(data);
          ctx.commit('setItems', { storeKey, items: data[dataKey] });
        });
      }

      subscribeModule(Transactions, 'transactions', 'transactions');
      subscribeModule(Accounts, 'accounts', 'accounts');
    }
  }
});
