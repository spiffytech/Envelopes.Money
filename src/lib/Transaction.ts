import * as shortid from 'shortid';

import Amount from './Amount';
import BucketAmount from './BucketAmount';
import {POJO as BucketAmountPOJO} from './BucketAmount';
import BucketReference from './BucketReference';
import {POJO as BucketReferencePOJO} from './BucketReference';
import {MoneyBucket, TxnExport, txnTypes} from './types';
import * as utils from './utils';

export interface TxnData<T> {
  _id: string | null;
  date: Date;
  memo: string;
  from: BucketReference;
  to: BucketAmount[];
  extra: T;
}

export interface TxnPOJO {
  _id: string;
  amount: number;
  date: string;
  memo: string;
  from: BucketReferencePOJO;
  to: BucketAmountPOJO[];
  type: 'transaction';
  subtype: txnTypes;
  extra: {[key: string]: any};
}

export default abstract class Transaction<T extends {}> {
  public date: Date;
  public memo: string;
  public from: BucketReference;

  protected abstract type: txnTypes;

  protected _id: string | null;
  protected _to: BucketAmount[];

  constructor(data: TxnData<T>) {
    this._id = data._id;
    this.date = data.date;
    this.memo = data.memo;
    this.from = data.from;
    this._to = data.to;

    this.postConstructor(data);
  }

  public toPOJO(): TxnPOJO {
    return {
      _id: this.id,
      amount: this.amount.pennies,
      date: this.date.toJSON(),
      memo: this.memo,
      from: this.from.toPOJO(),
      to: this.to.map((to) => to.toPOJO()),
      type: 'transaction',
      subtype: this.type,
      extra: this.extraPOJO(),
    };
  }

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

  public export(): TxnExport {
    return this.exportExtra({
      date: this.date,
      amount: this.amount,
      from: this.from.name,
      to: this.to.map((to) => to.bucketName).join('||'),
      memo: this.memo,
      type: this.type,
    });
  }

  get getFromName() {
    return this.from.name;
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

  /**
   * Removes entries in our 'to' property with a zero amount
   */
  public removeZeroTo() {
    this._to = this._to.filter(
      ({amount}) => amount.pennies !== 0,
    );
  }

  /**
   * Use this when you want to perform some action based on this transaction's
   * type, but in a queryless "tell don't ask" manner
   * @param fn Receives the object's type and does something with it
   */
  public withType<U>(fn: (type: txnTypes) => U): U {
    return fn(this.type);
  }

  /**
   * For subclasses to return additional validation errors
   */
  protected errorsExtra(): string[] {
    return [];
  }

  protected exportExtra(data: TxnExport): TxnExport & T {
    return data as TxnExport & T;
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

  protected postConstructor(_data: TxnData<T>) {
    return;
  }

  protected extraPOJO(): T {
    return {} as T;
  }

  get amount() {
    return Amount.Pennies(
      -1 * this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0),
    );
  }
}
