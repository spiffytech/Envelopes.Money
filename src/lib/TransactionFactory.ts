import Account from './Account';
import AccountTransfer from './AccountTransfer';
import BankTxn from './BankTxn';
import Category from './Category';
import EnvelopeTransfer from './EnvelopeTransfer';
import {ITxnData} from './Transaction';
import * as Types from './types';

export default function factory(txn: ITxnData, type: Types.txnTypes) {
  if (type === 'accountTransfer') return new AccountTransfer(txn);
  else if (type === 'banktxn') return new BankTxn(txn);
  else if (type === 'envelopeTransfer') return new EnvelopeTransfer(txn);
  else throw new Error(`Invalid txn type ${(txn as any).type}`);
}

export function Empty(objType: Types.txnTypes, from: Account | Category, userId: string) {
  const txnData: ITxnData = {
    id: '',
    date: new Date(),
    payee: null,
    memo: '',
    from,
    to: [],
    userId,
  };

  if (objType === 'accountTransfer') return new AccountTransfer(txnData);
  else if (objType === 'banktxn') return new BankTxn(txnData);
  else if (objType === 'envelopeTransfer') return new EnvelopeTransfer(txnData);
  else throw new Error(`Invalid txn type ${objType}`);
}
