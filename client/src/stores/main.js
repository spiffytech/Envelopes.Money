import * as R from "ramda";
import { derived, writable } from "svelte/store";

import * as Accounts from "../lib/Accounts";
import * as Balances from "../lib/Balances";
import * as Transactions from "../lib/Transactions";
import {formatDate} from '../lib/utils';

// TODO: Trampoline this because it's going to overflow
function calcDaysInPeriod(
  periodStart,
  days = [],
  periodEnd = new Date()
) {
  // THe extra day is a hack until we figure out storing+parsing dates in a
  // consistent timezone
  if (new Date(periodEnd.getTime() + 86400000) < periodStart) return days;
  const nextDate = new Date(periodStart.getTime() + 86400000);
  return calcDaysInPeriod(nextDate, [...days, periodStart], periodEnd);
}

function calcBalancesForAccount(
  amounts
){
  const amountsByDate = R.groupBy((amount) => amount.date, amounts);
  const minDate = Math.min(
    ...amounts.map(({ date }) => new Date(date).getTime())
  );
  const dates = calcDaysInPeriod(new Date(minDate));
  const { ret: finalRet } = dates.reduce(
    ({ ret, lastValue }, date) => {
      const dateStr = formatDate(date);
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
    { ret: {}, lastValue: 0 }
  );

  return finalRet;
}

function balancesByAccountByDay(transactionsArr, accounts)
{
  const accountIdWithTxnAmount
  = R.flatten(
    transactionsArr.map(txn => [
      { accountId: txn.from_id, date: txn.date, amount: -txn.amount },
      {
        accountId: txn.to_id,
        date: txn.date,
        amount: txn.amount * (txn.type === "banktxn" ? -1 : 1)
      }
    ])
  );

  const txnAmountsByAccount = R.groupBy(account => account.accountId, accountIdWithTxnAmount);
  const accountBalancesByDay = Object.entries(txnAmountsByAccount).map(
    ([accountId, amounts]) => ({
      account: accounts[accountId],
      balances: calcBalancesForAccount(amounts)
    })
  );
  return accountBalancesByDay;
}

export const store = writable({
  accounts: {},
  balances: [],
  searchTerm: "",
  transactions: {},
  periodLength: 15
});

export const arrays = derived(store, $store => {
  const txnsArr = Object.values($store.transactions).sort(
      R.comparator((a, b) => a.date > b.date)
  );

  const txnsGrouped = Object.values(
    R.groupBy(txn => txn.txn_id, txnsArr)
  )
    .map(txnGroup => {
      const toNames = txnGroup.map(txn =>
        $store.accounts[txn.to_id] ? $store.accounts[txn.to_id].name : "unknown"
      );
      const fromName = $store.accounts[txnGroup[0].from_id]
        ? $store.accounts[txnGroup[0].from_id].name
        : "unknown";
      return {
        to_names: toNames.join(", "),
        to_ids: txnGroup.map(txn => txn.to_id).join(","),
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
    })
    .sort(R.comparator((a, b) => a.date > b.date));

  const balancesByAccountByDay_ = balancesByAccountByDay(txnsArr, $store.accounts);

  return {
    ...$store,
    txnsGrouped: txnsGrouped.filter(
      txnGrouped =>
        (txnGrouped.label || "").toLowerCase().includes($store.searchTerm) ||
        (txnGrouped.memo || "").toLowerCase().includes($store.searchTerm) ||
        txnGrouped.from_name.toLowerCase().includes($store.searchTerm) ||
        txnGrouped.to_names.toLowerCase().includes($store.searchTerm) ||
        (txnGrouped.amount / 100).toFixed(2).includes($store.searchTerm)
    ),

    balancesByAccountByDay: balancesByAccountByDay_,
    envelopeBalances: balancesByAccountByDay_.filter((b) => b.account.type === 'envelope'),
    accountBalances: balancesByAccountByDay_.filter((b) => b.account.type === 'account'),
  };
});

/**
 * Subscribes to a given module's data set, updating the supplied store key on
 * every update
 */
function subscribeModule(graphql, module, storeKey, dataKey) {
  module.subscribe(graphql, ({ data }) => {
    store.update($store => ({
      ...$store,
      [storeKey]: data[dataKey]
    }));
  });
}

export function subscribe(graphql) {
  window.dostuff = () => Balances.subscribe(graphql, console.log);
  Accounts.subscribe(graphql, ({ data }) =>
    store.update($store => ({
      ...$store,
      accounts: R.fromPairs(data.accounts.map(account => [account.id, account]))
    }))
  );
  subscribeModule(graphql, Balances, "balances", "balances");
  Transactions.subscribe(graphql, ({ data }) =>
    store.update($store => ({
      ...$store,
      transactions: R.fromPairs(data.transactions.map(txn => [txn.id, txn]))
    }))
  );
}

store.subscribe(console.log);
