import Amount from './Amount';

export interface ITxnExport {
  date: Date;
  amount: Amount;
  to: string;
  from: string;
  memo: string;
  type: string;
}

export type BucketTypes = 'category' | 'account';

export interface IMoneyBucket {
  name: string;
  id: string;
  amount: Amount;
  type: BucketTypes;
}

export type txnTypes = 'banktxn' | 'envelopeTransfer' | 'accountTransfer';
