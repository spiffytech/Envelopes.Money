import AccountTransfer from './AccountTransfer';
import BankTxn from './BankTxn';
import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import EnvelopeTransfer from './EnvelopeTransfer';
import {TxnPOJO} from './Transaction';
import * as Types from './types';

export default function factory(txn: TxnPOJO | TxnPOJO & {payee: string}) {
  const txnData = {
    _id: txn._id,
    date: new Date(txn.date),
    memo: txn.memo,
    from: BucketReference.POJO({name: txn.from.name, id: txn.from.id, type: txn.from.type}),
    to: txn.to.map((category) =>
      BucketAmount.POJO({
        amount: category.amount,
        bucketRef: category.bucketRef,
      }),
    ),
  };

  if (txn.type === 'accountTransfer') return new AccountTransfer(txnData);
  else if (txn.type === 'banktxn') return new BankTxn({...txnData, payee: (txn as any).payee});
  else if (txn.type === 'envelopeTransfer') return new EnvelopeTransfer(txnData);
  else throw new Error(`Invalid txn type ${(txn as any).type}`);
}

export function Empty(objType: 'accountTransfer' | 'envelopeTransfer' | 'banktxn') {
  const fromType = ({
    accountTransfer: 'account',
    envelopeTransfer: 'category',
    banktxn: 'category',
  } as {[key: string]: Types.BucketTypes})[objType];

  const txnData = {
    _id: '',
    date: new Date(),
    memo: '',
    from: BucketReference.POJO({name: '', id: '', type: fromType}),
    to: [],
  };

  if (objType === 'accountTransfer') return new AccountTransfer(txnData);
  else if (objType === 'banktxn') return new BankTxn({...txnData, payee: ''});
  else if (objType === 'envelopeTransfer') return new EnvelopeTransfer(txnData);
  else throw new Error(`Invalid txn type ${objType}`);
}