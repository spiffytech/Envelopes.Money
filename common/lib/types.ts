export type TxnTypes = 'banktxn' | 'accountTransfer' | 'envelopeTransfer' | 'fill';
export interface ITransaction {
  id: string;
  user_id: string;
  memo: string;
  date: string;
  amount: number;
  label: string | null;
  type: TxnTypes;
  txn_id: string;
  from_id: string;
  to_id: string;
}

export interface Envelope {
  id: string;
  user_id: string;
  name: string;
  type: 'envelope';
  extra: {
    due: Date | null;
    target: number;
    interval: 'total' | 'weekly' | 'biweekly' | 'bimonthly' | 'monthly' | 'annually'
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

export interface Balance {
  id: string;
  user_id: string;
  name: string;
  type: string;
  extra: {[key: string]: any};
  balance: number;
}
