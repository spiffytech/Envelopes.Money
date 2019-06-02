import fromPairs from 'lodash/fromPairs';
import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export function isBalanceEnvelope(account) {
  return account.type === 'envelope';
}

const durations = {
  total: 0,
  weekly: 7,
  biweekly: 14,
  bimonthly: 15,
  monthly: 30,
  annually: 365,
}

export function daysUntilDue(due) {
  return Math.round(new Date(due).getTime() - new Date().getTime()) / 86400000;
}

/**
 * Multiply the envelope's remaining balance due by this and fill
 * @param fillDays How many days each fill represents
 * @param dueDays Days until the envelope is due
 */
export function multiplierWithDueDate(fillDays, dueDays) {
  // Returns the number of remaining fills rounded to the nearest multiple of fillDays
  return fillDays / (Math.max(1, Math.floor((dueDays/fillDays))) * fillDays);
}

export function calcRemainingBalance(balance) {
  return Math.max(0, balance.extra.target - balance.balance);
}

export function calcAmountWithDueDate(balance) {
  const due = balance.extra.due;
  if (!due) throw new Error('Should always have a due date when calling this function');

  return fromPairs(
    ['weekly', 'biweekly', 'bimonthly', 'monthly', 'annually', 'total'].
    map((interval) => [
      interval,
      (
        calcRemainingBalance(balance) *
        multiplierWithDueDate(durations[interval], daysUntilDue(due))
      ),
    ])
  );
}

export function calcAmountRegularInterval(balance) {
  const due = balance.extra.due;
  if (due) throw new Error('Should never have a due date when calling this function');

  return fromPairs(
    ['weekly', 'biweekly', 'bimonthly', 'monthly', 'annually', 'total'].
    map((interval) => [
      interval,
      balance.extra.interval === 'total' ? 0 :
      balance.extra.target * (durations[interval] / durations[balance.extra.interval])
    ])
  );
}

export function calcAmountForPeriod(balance) {
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

export function loadBalances({userId, apikey}) {
  const apollo = mkApollo(apikey);
  return apollo.query({

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

export async function subscribe({userId, apollo}, onData) {
  return apollo.subscribe({
    query: gql`
      ${fragments}
      subscription SubscribeBalances($user_id: String!) {
        balances(where: {user_id: {_eq: $user_id}}) {
          ...balance
        }
      }
    `,
    variables: {user_id: userId},
  }).subscribe({next: onData});
}
