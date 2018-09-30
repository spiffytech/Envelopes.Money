import Transaction from './Transaction';
import {TxnExport} from './types';

export default class EnvelopeTransfer extends Transaction<any> {
  protected type = 'envelopeTransfer';

  public export(): TxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from.name,
      to: this.to.map((to) => to.bucketName).join('||'),
      memo: this.memo,
      type: 'envelopeTransfer',
    };
  }
}
