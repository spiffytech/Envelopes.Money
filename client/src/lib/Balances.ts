import fromPairs from 'lodash/fromPairs';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {BankAccount, Envelope, Intervals, INTERVALS} from './Accounts';

export interface BalanceEnvelope extends Envelope {
  balance: number;
}
export interface BalanceBankAccount extends BankAccount {
  balance: number;
}

export type T = BalanceBankAccount | BalanceEnvelope;

export function isBalanceEnvelope(account: T): account is BalanceEnvelope {
  return account.type === 'envelope';
}

const durations: {[key in Intervals]: number} = {
  total: 0,
  weekly: 7,
  biweekly: 14,
  bimonthly: 15,
  monthly: 30,
  annually: 365,
}

export function daysUntilDue(due: Date | string) {
  return Math.round(new Date(due).getTime() - new Date().getTime()) / 86400000;
}

/**
 * Multiply the envelope's remaining balance due by this and fill
 * @param fillDays How many days each fill represents
 * @param dueDays Days until the envelope is due
 */
export function multiplierWithDueDate(fillDays: number, dueDays: number) {
  // Returns the number of remaining fills rounded to the nearest multiple of fillDays
  return fillDays / (Math.max(1, Math.floor((dueDays/fillDays))) * fillDays);
}

export function calcRemainingBalance(balance: {balance: number, extra: {target: number}}) {
  return Math.max(0, balance.extra.target - balance.balance);
}

export function calcAmountWithDueDate(balance: BalanceEnvelope): {[key in Intervals]: number} {
  const due = balance.extra.due;
  if (!due) throw new Error('Should always have a due date when calling this function');

  return fromPairs(
    INTERVALS.map((interval) => [
      interval,
      (
        calcRemainingBalance(balance) *
        multiplierWithDueDate(durations[interval as Intervals], daysUntilDue(due))
      ),
    ])
  ) as {[key in Intervals]: number};
}

export function calcAmountRegularInterval(balance: BalanceEnvelope): {[key in Intervals]: number} {
  const due = balance.extra.due;
  if (due) throw new Error('Should never have a due date when calling this function');

  return fromPairs(
    INTERVALS.map((interval) => [
      interval,
      balance.extra.interval === 'total' ? 0 :
      balance.extra.target * (durations[interval as Intervals] / durations[balance.extra.interval])
    ])
  ) as {[key in Intervals]: number};
}

export function calcAmountForPeriod(balance: BalanceEnvelope): {[key in Intervals]: number} {
  if (!balance.extra.target) return {
    weekly: 0,
    biweekly: 0,
    bimonthly: 0,
    monthly: 0,
    annually: 0,
    total: 0,
  };

  if (balance.extra.due) {
    return calcAmountWithDueDate(balance);
  }

  return calcAmountRegularInterval(balance);
}

export function loadBalances(userId: string, apiKey: string) {
  const apollo = mkApollo(apiKey);
  return apollo.query<{balances: T[]}>({
    query: gql`
      ${fragments}
      query GetBalances($user_id: String!) {
        balances(where: {user_id: {_eq: $user_id}}) {
          ...balance
        }
      }
    `,
    variables: {user_id: userId},
  });
}
