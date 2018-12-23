export interface ITransaction {
  id: string;
  user_id: string;
  memo: string;
  date: Date;
  amount: number;
  label: string | null;
  type: string;
}

export interface ITransactionPart {
  id: string;
  transaction_id: string;
  amount: number;
  account_id: string | null;
  user_id: string;
}

export interface TxnWithParts {
  transaction: ITransaction;
  parts: ITransactionPart[];
};

interface IBucketCore {
  id: string;
  user_id: string;
  name: string;
}

interface IBucketAccount extends IBucketCore {
  type: 'account';
  extra: {};
}

interface IBucketEnvelope extends IBucketCore {
  type: 'envelope';
  extra: {
    target: number;
    interval: 'weekly' | 'semimonthly' | 'twoweeks' | 'monthly' | 'yearly' | 'total';
    due: Date | null;
  };
}

export type IBucket = IBucketAccount | IBucketEnvelope;

export interface TxnTuple {
  transaction: ITransaction;
  parts: ITransactionPart[];
  buckets: IBucket[];
}

export interface AccountBalance {
  bucket: IBucket;
  balance: number;
}
