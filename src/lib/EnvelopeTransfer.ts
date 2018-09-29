import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {TxnExport} from './types';

export default class EnvelopeTransfer extends Transaction<TxnData> {
  public static Empty() {
    return new EnvelopeTransfer({
      _id: null,
      date: new Date(),
      memo: '',
      from: BucketReference.Empty('category'),
      to: [],
    });
  }

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
