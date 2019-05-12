export type TxnTypes = 'banktxn' | 'accountTransfer' | 'envelopeTransfer' | 'fill';
export interface ITransaction {
  id: string;
  user_id: string;
  memo: string;
  date: Date;
  amount: number;
  label: string | null;
  type: TxnTypes;
  txn_id: string;
  from_id: string;
  to_id: string;
}

export const INTERVALS = ['total', 'weekly', 'biweekly', 'bimonthly', 'monthly', 'annually'] as const;
export type Intervals = typeof INTERVALS[number];

export interface Envelope {
  id: string;
  user_id: string;
  name: string;
  type: 'envelope';
  extra: {
    due: Date | string | null;
    target: number;
    interval: Intervals;
  };
  tags: {[key: string]: string};
}

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'account';
  extra: {};
}

export type IAccount = Envelope | BankAccount;

export interface TxnGrouped {
  to_names: string;
  to_ids: string;
  amount: number;
  txn_id: string;
  user_id: string;
  label: string;
  date: string;
  memo: string;
  type: string;
  from_id: string;
  from_name: string;
}

export interface Balance {
  id: string;
  user_id: string;
  name: string;
  type: string;
  extra: string;
  balance: number;
}