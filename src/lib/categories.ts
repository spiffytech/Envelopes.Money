import _ from 'lodash';
import {BankEvent, isTxn} from './txns';

export interface Category {
  name: string;
  interval: 'weekly' | 'monthly' | 'bimonthly' | 'yearly' | 'total';
  target: number;
  group: string | null;
  sortOrder: number;
}

export interface CategoryBalance {
  name: string;
  balance: number;
}

export function discoverCategories(events: BankEvent[]) {
  const all = events.
    filter(isTxn).
    map((txn) => Object.keys(txn.categories));

  return _.uniq(_.flatten(all));
}

export function calcBalances(categories: Category[], events: BankEvent[]): Map<string, CategoryBalance> {
    const kv: [string, CategoryBalance][] = categories.map(({name: category}) =>
      [
        category,
        {
          name: category,
          balance: events.
            filter(isTxn).
            map((txn) => txn.categories[category]).
            filter(Boolean).
            reduce((acc, item) => acc + item, 0)
        }
      ] as [string, CategoryBalance]
    )
  return new Map(kv);
}