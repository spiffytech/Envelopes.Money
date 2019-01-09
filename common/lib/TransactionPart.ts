import * as shades from 'shades';
import {lens} from 'lens.ts';

export interface T {
  id: string;
  transaction_id: string;
  amount: number;
  account_id: string | null;
  user_id: string;
}

const amountAsNumber = {
  get: (amount: number | string) => parseFloat(amount.toString()),
  mod: (fn: any) => (amount: number | string) => fn(amount),
}

export const getAmount = lens<T>().amount.get

export function sum(parts: Array<Pick<T, 'amount'> | {amount: string}>): number {
  return (
    parts.map(getAmount).
    map((amount) => parseFloat(amount.toString())).
    reduce((acc, item) => acc + item, 0)
  );
}
