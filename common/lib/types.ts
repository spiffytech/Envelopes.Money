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
  from_id: string;
  to_id: string;
  user_id: string;
}

export type TxnWithParts = {transaction: ITransaction, parts: ITransactionPart[]};

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
