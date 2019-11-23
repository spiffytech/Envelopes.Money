export interface Transaction {
  id: string;
  memo: string | null;
  date: string;
  amount: number;
  label: string | null;
  from_id: string;
  to_id: string;
  cleared: boolean;
  txn_id: string;
}

interface BankAccount {
  id: string;
  name: string;
  type: 'account';
}
interface Envelope {
  id: string;
  name: string;
  type: 'envelope';
}

export type Account = BankAccount | Envelope;

export interface TransactionWithAccounts {
  transaction: Transaction;
  from: Account;
  to: Account;
}

export type TransactionGroup = TransactionWithAccounts[];
