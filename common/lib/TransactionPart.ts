import * as shades from 'shades';

export interface T {
  id: string;
  transaction_id: string;
  amount: number;
  account_id: string | null;
  user_id: string;
}

const amountAsNumber = {
  get: (amount) => parseFloat(amount.toString()),
  mod: (fn) => (amount) => fn(amount),
}

export const getAmount = shades.get('amount');
export const setAmount = shades.set('amount');

export function sum(parts: Array<Pick<T, 'amount'> | {amount: string}>): number {
  return (
    parts.map(getAmount).
    map((amount) => parseFloat(amount.toString())).
    reduce((acc, item) => acc + item, 0)
  );
}
