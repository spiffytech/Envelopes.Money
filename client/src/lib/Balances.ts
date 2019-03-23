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
  const interval =
    balance.extra.interval === 'weekly' ? 7 :
    balance.extra.interval === 'biweekly' ? 14 :
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
      Math.round(balance.extra.target / interval)
    ])
  ) as {[key in Intervals]: number};
}

export function loadTransaction(userId: string, apiKey: string) {
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
