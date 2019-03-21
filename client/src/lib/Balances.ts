import gql from 'graphql-tag';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import {BankAccount, Envelope} from './Accounts';

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
