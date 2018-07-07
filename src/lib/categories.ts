import {TxnItem} from './txns';

export interface Category {
  name: string;
  interval: 'weekly' | 'monthly' | 'bimonthly' | 'yearly' | 'total';
  target: number;
  group: string | null;
  sortOrder: number;
}

export interface CategoryBalance {
  account: string;
  balance: number;
}

export function discoverCategories(txnItems: TxnItem[]) {
  return txnItems.
    filter((item) => item.account.startsWith('Expenses')).
    map((item) => item.account.replace(/^Expenses:/, ''));
}
