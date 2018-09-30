import Transaction from './Transaction';
import {TxnExport} from './types';

export default class AccountTransfer extends Transaction<any> {
  protected type = 'accountTransfer';

  public export(): TxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from.name,
      to: this._to[0].bucketName,
      memo: this.memo,
      type: 'accountTransfer',
    };
  }
}
