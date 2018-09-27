import * as shortid from 'shortid';

import Amount from './Amount';
import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import {EnvelopeTransfer as ClassicEnvelopeTransfer} from './txns';
import * as Txns from './txns';
import {EnvelopeEvent, TxnExport} from './types';
import * as utils from './utils';

interface ETData {
  _id: string | null;
  date: Date;
  memo: string;
  from: BucketReference;
  to: BucketAmount[];
}

export default class EnvelopeTransfer {
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

  public date: Date;
  public memo: string;
  public from: BucketReference;
  private _id: string | null;
  private _to: BucketAmount[] = [];

  private _debitMode = false;

  protected constructor(data: ETData) {
    this._id = data._id;
    this.date = data.date;
    this.memo = data.memo;
    this.from = data.from;
    this._to = data.to;
  }

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

  get amount() {
    return Amount.Pennies(
      this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0),
    );
  }

  get dateString() {
    return utils.formatDate(this.date);
  }

  set dateString(d: string) {
    this.date = new Date(d);
  }

  get debitMode() {
    return this._debitMode;
  }

  set debitMode(b: boolean) {
    if (this._debitMode !== b) this.amount.pennies *= -1;
    this._debitMode = b;
  }

  get id() {
    return (
      this._id  ||
      ['txn', utils.formatDate(this.date), 'envelopeTransfer', shortid.generate()].join('/')
    );
  }

  get to() {
    return this._to;
  }

  public addTo(event: EnvelopeEvent) {
    this._to.push(BucketAmount.POJO({
      amount: event.amount.pennies,
      bucketRef: {name: event.name, id: event.id, type: 'category'},
    }));
  }

  public errors(): string[] | null {
    const errors = [
      this.amount.pennies === 0 && 'May not transfer $0',
      this._to.length === 0 && 'Must move money to at least one category',
      this._to.filter((to) => to.amount.pennies === 0).length > 0 && 'All movement must have a non-zero amount',
      this.amount.pennies !==
        this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0) &&
        '"from" and "to" amounts don\'t match',
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }
}
