import * as shortid from 'shortid';

import Amount from './Amount';
import BucketAmount from './BucketAmount';
import {POJO as BucketAmountPOJO} from './BucketAmount';
import BucketReference from './BucketReference';
import {POJO as BucketReferencePOJO} from './BucketReference';
import {MoneyBucket, TxnExport} from './types';
import * as utils from './utils';

export interface TxnData {
  _id: string | null;
  date: Date;
  memo: string;
  from: BucketReference;
  to: BucketAmount[];
}

interface TxnPOJO {
  _id: string;
  amount: number;
  date: string;
  memo: string;
  from: BucketReferencePOJO;
  to: BucketAmountPOJO[];
  type: string;
  extra: {[key: string]: any};
}

export default abstract class Transaction<T extends TxnData> {
  public date: Date;
  public memo: string;
  public from: BucketReference;

  protected abstract type: string;

  protected _id: string | null;
  protected _to: BucketAmount[];

  constructor(data: T) {
    this._id = data._id;
    this.date = data.date;
    this.memo = data.memo;
    this.from = data.from;
    this._to = data.to;

    this.postConstructor(data);
  }

  public abstract export(): TxnExport;

  public abstract toPOJO(): any;
  /*
  public toPOJO(): TxnPOJO {
    const pojo = {
      _id: this.id,
      amount: this.amount,
      date: this.date.toJSON(),
      memo: this.memo,
      from: this.from.toPOJO(),
      to: this.to.map((to) => to.toPOJO()),
      type: this.type,
      extra: {},
    };

    return this.pojoExtra(pojo);
  }
  */

  public addTo(event: BucketAmount) {
    this._to.push(event);
  }

  public errors(): string[] | null {
    if (this._to.length === 0) return ['You must send money to at least one bucket'];
    const errors = [
      this.amount.pennies === 0 && 'May not transfer $0',
      !this.from.name && 'You must select a "from" bucket',
      !this.from.id && 'Program error: from.id did not get set',
      !this._to[0].bucketName && 'You must supply a "to" category',
      !this._to[0].bucketId && 'Program error: toId did not get set',
      this.to.filter((to) => to.amount.pennies === 0).length > 0 && 'All categories must have a non-zero balance',
      ...this.errorsExtra(),
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

  public removeZeroTo() {
    this._to = this._to.filter(
      ({amount}) => amount.pennies !== 0,
    );
  }

  protected errorsExtra(): string[] {
    return [];
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
      ['txn', utils.formatDate(this.date), this.type, shortid.generate()].join('/')
    );
  }

  get to() {
    return this._to;
  }

  protected postConstructor(_data: TxnData & T) {
    return;
  }

  protected pojoExtra(pojo: TxnPOJO): TxnPOJO {
    return pojo;
  }

  get amount() {
    return Amount.Pennies(
      this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0),
    );
  }
}
