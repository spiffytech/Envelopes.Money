export interface LedgerEvent {
  id: string;
  date: Date;
  payee: string;
  account: string;
  amount: number;
  memo: string;
}

export interface EnvelopeTransfer {
  date: Date;
  amount: number;
  memo: string;
  categories: {[key: string]: number};
  type: 'envelopeTransfer';
}

export interface Txn extends LedgerEvent {
  categories: {[key: string]: number};
  type: 'transaction';
}

export interface AccountTransfer extends LedgerEvent {
  txfrId: string;
  type: 'accountTransfer';
}

export type BankEvent = Txn | AccountTransfer;

export function isTxn(item: BankEvent): item is Txn {
  return item.type === 'transaction';
}

export function isTxfr(item: BankEvent): item is AccountTransfer {
  return item.type === 'accountTransfer';
}
