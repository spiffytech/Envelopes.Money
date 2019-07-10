import flatten from "lodash/flatten";
import groupBy from "lodash/groupBy";
import { action, computed, observable } from "mobx";
import * as R from "ramda";
import React from "react";
import { formatDate } from "./lib/utils";

import * as Accounts from "./lib/Accounts";
import * as Transactions from "./lib/Transactions";
import { IAccount, BankAccount, Envelope, TxnGrouped, isEnvelope, isBankAccount, ITransaction } from "./lib/types";
import { GraphqlParams } from "./lib/types";

export interface IAccountBalance {
  account: BankAccount;
  balances: {
    [date: string]: number;
  };
} 
export interface EnvelopeBalance {
  account: Envelope;
  balances: {
    [date: string]: number;
  };
}

export type AccountBalance = IAccountBalance | EnvelopeBalance;

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
  const amountsByDate = groupBy(amounts, "date");
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
    { ret: {} as { [date: string]: number }, lastValue: 0 }
  );

  return finalRet;
}

export class Store {
  @observable transactions = {} as { [id: string]: Transactions.T };
  @observable accounts = {} as { [id: string]: IAccount };

  constructor(public creds: {userId: string, apikey: string}) {}

  @computed get periodLength() {
    return 15;
  }

  @computed get balancesByAccountByDay(): {
    account: IAccount;
    balances: { [date: string]: number };
  }[] {
    const accountIdWithTxnAmount: {
      accountId: string;
      date: string;
      amount: number;
    }[] = flatten(
      (this.transactionsSorted as Transactions.T[]).map(txn => [
        { accountId: txn.from_id, date: txn.date, amount: -txn.amount },
        {
          accountId: txn.to_id,
          date: txn.date,
          amount: txn.amount * (txn.type === "banktxn" ? -1 : 1)
        }
      ])
    );

    const txnAmountsByAccount = groupBy(accountIdWithTxnAmount, "accountId");
    const accountBalancesByDay = Object.entries(txnAmountsByAccount).map(
      ([accountId, amounts]) => ({
        account: this.accounts[accountId],
        balances: calcBalancesForAccount(amounts)
      })
    );
    return accountBalancesByDay;
  }

  @computed get accountBalances(): IAccountBalance[] {
    return this.balancesByAccountByDay.filter(
      (balance): balance is IAccountBalance => isBankAccount(balance.account)
    );
  }

  @computed get envelopeBalances(): EnvelopeBalance[] {
    return this.balancesByAccountByDay.filter(
      (balance): balance is EnvelopeBalance => isEnvelope(balance.account)
    );
  }

  @computed get transactionsSorted() {
    return Object.values(this.transactions).sort(
      R.comparator((a, b) => a.date > b.date)
    );
  }

  @computed get txnsGrouped() {
    return Object.values(groupBy(this.transactionsSorted, "txn_id"))
      .map(
        (txnGroup): TxnGrouped => {
          const toNames = txnGroup.map(txn =>
            this.accounts[txn.to_id] ? this.accounts[txn.to_id].name : "unknown"
          );
          const fromName = this.accounts[txnGroup[0].from_id]
            ? this.accounts[txnGroup[0].from_id].name
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
        }
      )
      .sort(R.comparator((a, b) => a.date > b.date));
  }

  subscribeModule<Data>(
    graphql: GraphqlParams,
    module_: {
      subscribe: (
        g: GraphqlParams,
        onData: ({ data }: { data: Data }) => void
      ) => void;
    },
    setterFn: (data: Data) => void
  ) {
    module_.subscribe(graphql, action(({ data }) => setterFn(data)));
  }
  subscribeTransactions(graphql: GraphqlParams) {
    this.subscribeModule(graphql, Transactions, ({ transactions }) =>
      transactions.forEach(
        transaction => (this.transactions[transaction.id] = transaction)
      )
    );
  }
  subscribeAccounts(graphql: GraphqlParams) {
    this.subscribeModule(graphql, Accounts, ({ accounts }) =>
      accounts.forEach(account => (this.accounts[account.id] = account))
    );
  }
  async subscribeAll(graphql: GraphqlParams) {
    // TODO: Make sure we can handle out-of-order subscription to these, or make them subscribe in sequence
    this.subscribeAccounts(graphql);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.subscribeTransactions(graphql);
  }

  saveTransactions(txns: ITransaction[]) {
    Transactions.saveTransactions(this.creds, txns);
  }
}

const store = new Store({userId: '', apikey: ''});
const StoreContext = React.createContext<Store>(store);
export const StoreProvider = StoreContext.Provider;
export const StoreConsumer = StoreContext.Consumer;
export default StoreContext;
