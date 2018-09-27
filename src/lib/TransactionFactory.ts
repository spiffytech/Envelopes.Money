import AccountTransfer from './AccountTransfer';
import BankTxn from './BankTxn';
import EnvelopeTransfer from './EnvelopeTransfer';
import * as Txns from './txns';

export default function factory(txn: Txns.Txn) {
  if (txn.type === 'accountTransfer') return AccountTransfer.POJO(txn);
  else if (txn.type === 'banktxn') return BankTxn.POJO(txn);
  else if (txn.type === 'envelopeTransfer') return EnvelopeTransfer.POJO(txn);
  else throw new Error(`Invalid txn type ${(txn as any).type}`);
}
