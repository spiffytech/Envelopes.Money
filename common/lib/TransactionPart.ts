import * as shades from 'shades';
import {lens} from 'lens.ts';
import {Lens} from 'shades/types/utils';

export interface T {
  id: string;
  transaction_id: string;
  amount: number;
  account_id: string | null;
  user_id: string;
}

const amountAsNumber: Lens<string | number, number> = {
  get: (amount: number | string) => parseFloat(amount.toString()),
  mod: (fn) => (amount: number | string) => fn(parseFloat(amount.toString())),
  traversal: false,
};

// export const getAmount = lens<Pick<T, 'amount'>>().amount.get
export const getAmount = shades.get('amount', amountAsNumber);
export const setAmount = shades.mod('amount', amountAsNumber);

export function sum(parts: Array<Pick<T, 'amount'> | {amount: string}>): number {
  return (
    parts.map(getAmount).
    map((amount) => parseFloat(amount.toString())).
    reduce((acc, item) => acc + item, 0)
  );
}
