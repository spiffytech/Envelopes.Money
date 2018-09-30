import Transaction from './Transaction';
import {TxnExport} from './types';

export default class AccountTransfer extends Transaction<any> {
  protected type = 'accountTransfer';
}
