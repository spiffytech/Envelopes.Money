import * as shortid from 'shortid';

import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {AccountTransfer as ClassicAccountTransfer} from './txns';
import * as Txns from './txns';
import {MoneyBucket, TxnExport} from './types';
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

  protected _debitMode = false;
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

  get dateString() {
    return utils.formatDate(this.date);
  }

  set dateString(d: string) {
    this.date = new Date(d);
  }

  get id() {
    return (
      this._id  ||
      ['txn', utils.formatDate(this.date), 'envelopeTransfer', shortid.generate()].join('/')
    );
  }

  get debitMode() {
    return this._debitMode;
  }

  set debitMode(b: boolean) {
    if (this._debitMode !== b) this.amount.pennies *= -1;
    this._debitMode = b;
  }

  get to() {
    return this._to;
  }

  public errors(): string[] | null {
    if (this._to.length === 0) return ['You must have a "to" account'];
    const errors = [
      this.amount.pennies === 0 && 'May not transfer $0',
      !this.from.name && 'Must supply a "from" category',
      !this.from.id && 'Program error: fromId did not get set',
      !this._to[0].bucketName && 'Must supply a "to" category',
      !this._to[0].bucketId && 'Program error: toId did not get set',
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }

  public setFromByName(candidates: MoneyBucket[], name: string) {
    const bucket = candidates.find((candidate) => candidate.name === name);
    if (!bucket) throw new Error(`No matching bucket form "${name}"`);
    this.from = new BucketReference({name: bucket.name, id: bucket.id, type: bucket.type});
  }

  public setToByName(candidates: MoneyBucket[], name: string, index: number) {
    const bucket = candidates.find((candidate) => candidate.name === name);
    if (!bucket) throw new Error(`No matching bucket form "${name}"`);
    this._to[index] = new BucketAmount(
      this._to[index].amount,
      new BucketReference({name: bucket.name, id: bucket.id, type: bucket.type}),
    );
  }
}
