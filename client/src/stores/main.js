import {get as getIdb, set as setIdb} from 'idb-keyval';
import comparator from "ramda/es/comparator";
import filter from "ramda/es/filter";
import flatten from "ramda/es/flatten";
import fromPairs from "ramda/es/fromPairs";
import groupBy from "ramda/es/groupBy";
import identity from 'ramda/es/identity';
import map from "ramda/es/map";
import { derived, writable } from "svelte/store";

import * as Accounts from "../lib/Accounts";
import * as Transactions from "../lib/Transactions";
import { formatDate } from "../lib/utils";

// TODO: Trampoline this because it's going to overflow
function calcDaysInPeriod(periodStart, days = [], periodEnd = new Date()) {
  // THe extra day is a hack until we figure out storing+parsing dates in a
  // consistent timezone
  if (new Date(periodEnd.getTime() + 86400000) < periodStart) return days;
  const nextDate = new Date(periodStart.getTime() + 86400000);
  return calcDaysInPeriod(nextDate, [...days, periodStart], periodEnd);
}

function calcBalancesForAccount(amounts) {
  const amountsByDate = groupBy(amount => amount.date, amounts);
  const minDate =
    amounts.length === 0
      ? new Date().getTime()
      : Math.min(...amounts.map(({ date }) => new Date(date + "T00:00").getTime()));
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

function balancesByAccountByDay(transactionsArr, accounts) {
  const txnsByAccount = flatten(
    transactionsArr.map(txn => [
      { accountId: txn.from_id, date: txn.date, amount: -txn.amount },
      {
        accountId: txn.to_id,
        date: txn.date,
        amount: txn.amount * (txn.type === "banktxn" ? -1 : 1)
      }
    ])
  );

  const txnAmountsByAccount = groupBy(
    account => account.accountId,
    txnsByAccount
  );
  const ret = fromPairs(
    Object.values(accounts).map(account => [
      account.id,
      {
        account,
        balances: calcBalancesForAccount(txnAmountsByAccount[account.id] || [])
      }
    ])
  );

  return ret;
}

/**
 * Given a bunch of transactions, calculates which from+to account combo is the
 * most commonly used so we can suggest that for the user to quick-fill
 */
function calcFieldsForLabel(txnsArr) {
  if (txnsArr.length === 0) return {};
  txnsArr.sort(comparator((a, b) => a.date < b.date));

  const txnsByLabel = filter(
    arr => arr.length > 0,
    groupBy(txn => txn.label, txnsArr)
  );
  return map(txnsForLabel => {
    const groups = groupBy(txn => `${txn.from_id}-${txn.to_id}`, txnsForLabel);
    const biggestGroup = Object.values(groups).reduce(
      (biggest, item) => (item.length > biggest.length ? item : biggest),
      []
    );
    return { from_id: biggestGroup[0].from_id, to_id: biggestGroup[0].to_id };
  }, txnsByLabel);
}

export const store = writable({
  searchTerm: "",
  transactions: {},
  accounts: {},
  periodLength: 15,

  connecting: false,
  connected: false,
  loadedItems: {
    accounts: false,
    transactions: false
  }
});

export const arrays = derived(store, $store => {
  const txnsArr = Object.values($store.transactions).sort(
    comparator((a, b) => a.date > b.date)
  );

  const txnsGrouped = Object.values(groupBy(txn => txn.txn_id, txnsArr))
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
        type: txnGroup[0].type,
        cleared: txnGroup[0].cleared
      };
    })
    .sort(comparator((a, b) => a.date === b.date ? a.insertionOrder > b.insertionOrdor : a.date > b.date));

  console.time("Compute balances");
  const balancesByAccountByDay_ = balancesByAccountByDay(
    txnsArr,
    $store.accounts
  );
  console.timeEnd("Compute balances");

  console.time("Calc label quickfills");
  const labelQuickFills = calcFieldsForLabel(txnsArr);
  console.timeEnd("Calc label quickfills");

  return {
    ...$store,
    isLoading: !(Object.values($store.loadedItems).every(identity)),
    txnsGrouped: txnsGrouped.filter(
      txnGrouped =>
        (txnGrouped.label || "").toLowerCase().includes($store.searchTerm.toLowerCase()) ||
        (txnGrouped.memo || "").toLowerCase().includes($store.searchTerm.toLowerCase()) ||
        txnGrouped.from_name.toLowerCase().includes($store.searchTerm.toLowerCase()) ||
        txnGrouped.to_names.toLowerCase().includes($store.searchTerm.toLowerCase()) ||
        (txnGrouped.amount / 100).toFixed(2).includes($store.searchTerm.toLowerCase())
    ),

    balancesByAccountByDay: balancesByAccountByDay_,
    envelopes: Object.values($store.accounts).filter(
      b => b.type === "envelope"
    ),
    accounts: Object.values($store.accounts).filter(b => b.type === "account"),
    labelQuickFills
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

function setLoaded(key) {
  store.update($store => {
    // Use a conditional to minimize rerenders
    if (!$store.loadedItems[key]) {
      return {...$store, loadedItems: {...$store.loadedItems, [key]: true}};
    }
    return $store;
  });
}

export async function subscribe(graphql) {
  const pendingData = {
    accounts: null,
    transactions: null
  };

  const setData = async (key, data, fromLocal=false) => {
    // Use the OR so we keep the default datastructure instead of undefined if
    // IndexedDB returns an empty value on page load
    pendingData[key] = data || pendingData[key];
    if (!fromLocal) setLoaded(key);
    await setIdb(key, data);

    // A bunch of our derived computations rely on all of the store data being
    // loaded. A partial load throws errors. So only set the values once they've
    // all arrived.
    const isReady = Object.values(pendingData).every(identity);
    if (!isReady) return;
    store.update($store => ({
      ...$store,
      ...pendingData,
    }));
  }

  const [accounts, transactions] = await Promise.all([
    getIdb('accounts'),
    getIdb('transactions')
  ]);
  setData('accounts', accounts, true);
  setData('transactions', transactions, true);

  Accounts.subscribe(graphql, async ({ data }) => {
    setData('accounts', fromPairs(data.accounts.map(account => [account.id, account])));
    await setIdb('accounts', pendingData.accounts);
  });
  Transactions.subscribe(graphql, async ({ data }) => {
    setData('transactions', fromPairs(data.transactions.map(txn => [txn.id, txn])));
    await setIdb('transactions', pendingData.transactions);
  });
}

window.store = arrays;
