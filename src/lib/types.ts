import Amount from './Amount';
import * as Txns from './txns';

// These are in here because putting them inside Txns means the Firebase
// functions tsc can't import them, since the txns module uses es2017 features
export interface DETxn {
  id: string;
  payee: string;
  date: Date;
  items: {[key: string]: number};
  memo: string;
}

export interface Account {
  name: string;
}

export interface Category {
  name: string;
}

export interface Txn {
  amount: Amount;
  dateString: string;
  toPOJO(): Txns.Txn;
  validate(): boolean;
}
export interface EnvelopeEvent {
  name: string;
  id: string;
  amount: Amount;
}
