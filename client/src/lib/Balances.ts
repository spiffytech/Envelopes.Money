import fromPairs from 'lodash/fromPairs';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {BankAccount, Envelope, Intervals} from './Accounts';

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

export function calcAmountForPeriod(balance: BalanceEnvelope): {[key in Intervals]: number} {
  if (balance.extra.due) {
    const baseline = balance.balance;
    const daysUntilDue =
      Math.round(new Date(balance.extra.due).getTime() - new Date().getTime()) / 86400000;
    const intervalsLeft: {[key in Intervals]: number} = {
      weekly: Math.max(1, Math.ceil(daysUntilDue / 7)),
      biweekly: Math.max(1, Math.ceil(daysUntilDue / 14)),
      monthly: Math.max(1, Math.ceil(Math.round(daysUntilDue / 30))),
      annually: Math.max(1, Math.ceil(daysUntilDue / 365)),
      total: daysUntilDue,
    };

    return fromPairs(
      Object.entries(intervalsLeft).
      map(([period, interval]) => [
        period,
        period === 'total' ?
          Math.round(Math.max(0, Math.round(balance.extra.target - baseline) / interval)) :
          Math.round(Math.max(0, Math.round(balance.extra.target - baseline) / interval)),
      ])
    ) as {[key in Intervals]: number};
  }

  const interval =
    balance.extra.interval === 'weekly' ? 7 :
    balance.extra.interval === 'biweekly' ? 15 :
    balance.extra.interval === 'monthly' ? 30 :
    balance.extra.interval === 'annually' ? 365 :
    1;

  const periods: {[key in Intervals]: number} = {
    weekly: interval / 7,
    biweekly: interval / 14,
    monthly: interval / 30,
    annually: interval / 365,
    total: interval,
  }


  return fromPairs(
    Object.entries(periods).
    map(([period, interval]) => [
      period,
      balance.extra.interval === 'total' ? 0 : Math.round(Math.max(0, Math.round(balance.extra.target / interval))),
    ])
  ) as {[key in Intervals]: number};
}

export function loadBalancess(userId: string, apiKey: string) {
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
