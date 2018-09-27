import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {AccountTransfer as ClassicAccountTransfer} from './txns';
import * as Txns from './txns';
import {TxnExport} from './types';
import * as utils from './utils';

export default class AccountTransfer extends Transaction<TxnData> {
  public static POJO(txn: ClassicAccountTransfer) {
    return new AccountTransfer({
      _id: txn._id,
      memo: txn.memo,
      date: new Date(txn.date),
      from: BucketReference.POJO({name: txn.from, id: txn.fromId, type: 'account'}),
      to: [BucketAmount.POJO({
        amount: txn.amount,
        bucketRef: {id: txn.toId, name: txn.to, type: 'account'},
      })],
    });
  }

  public static Empty() {
    return new AccountTransfer({
      _id: null,
      date: new Date(),
      memo: '',
      from: BucketReference.Empty('account'),
      to: [],
    });
  }

  protected type = 'accountTransfer';

  public toPOJO(): ClassicAccountTransfer {
    return {
      _id: this.id,
      date: this.date.toJSON(),
      amount: this.amount.pennies as Txns.Pennies,
      memo: this.memo,
      from: this.from.name,
      to: this._to[0]!.bucketName,
      fromId: this.from.id,
      toId: this._to[0].bucketId,
      type: 'accountTransfer',
    };
  }

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
