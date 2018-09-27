import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {EnvelopeTransfer as ClassicEnvelopeTransfer} from './txns';
import * as Txns from './txns';
import {TxnExport} from './types';
import * as utils from './utils';

export default class EnvelopeTransfer extends Transaction<TxnData> {
  public static POJO(txn: ClassicEnvelopeTransfer) {
    return new EnvelopeTransfer({
      _id: txn._id,
      date: new Date(txn.date),
      memo: txn.memo,
      from: BucketReference.POJO({name: txn.from.name, id: txn.from.id, type: 'category'}),
      to: txn.to.map((category) =>
        BucketAmount.POJO({
          amount: category.amount,
          bucketRef: {id: category.id, name: category.name, type: 'category'},
        }),
      ),
    });
  }

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
  public toPOJO(): ClassicEnvelopeTransfer {
    return {
      _id: this.id,
      date: this.date.toJSON(),
      amount: this.amount.pennies as Txns.Pennies,
      memo: this.memo,
      from: {id: this.from.id, name: this.from.name, amount: this.amount.pennies as Txns.Pennies},
      to: this._to.map((to) =>
        ({name: to.bucketName, id: to. bucketId, amount: to.amount.pennies as Txns.Pennies}),
      ),
      type: 'envelopeTransfer',
    };
  }

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
