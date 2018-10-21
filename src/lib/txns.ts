/* tslint:disable-next-line:no-var-requires */
export type Dollars = number & {_type: 'dollars'};
export type Pennies = number & {_type: 'pennies'};

export interface EnvelopeEvent {
  name: string;
  id: string;
  amount: Pennies;
}

export interface Balance {
  name: string;
  balance: Pennies;
}

export interface Account {
  _id: string;
  name: string;
  type: 'account';
}

export interface Category {
  name: string;
  target: Pennies;
  interval: 'weekly' | 'monthly' | 'yearly' | 'once';
  due?: string;
  type: 'category';
  _id: string;
}

export function penniesToDollars(pennies: Pennies): Dollars {
  return pennies / 100 as Dollars;
}
