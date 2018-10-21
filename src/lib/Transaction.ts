import * as shortid from 'shortid';

import Account, {IAccountPOJO} from './Account';
import Amount from './Amount';
import Category, {ICategoryPOJO} from './Category';
import {ITxnExport, txnTypes} from './types';
import * as utils from './utils';

export interface ITxnData {
  id: string | null;
  date: Date;
  payee: string | null;
  memo: string;
  from: Category | Account;
  to: Array<{amount: Amount, bucket: Category | Account}>
}

interface ITxnPOJOBase {
  id: string;
  amount: number;
  date: string;
  payee: string | null;
  memo: string;
  type: txnTypes;
}

interface IBucketAmountAccount {
  amount: number;
  account: IAccountPOJO;
  category: null;
}
interface IBucketAmountCategory {
  amount: number;
  account: null;
  category: ICategoryPOJO;
}

interface ITxnPOJOInA extends ITxnPOJOBase {
  from_account: IAccountPOJO;
  from_category: null;
  to: Array<IBucketAmountAccount | IBucketAmountCategory>
}
interface ITxnPOJOInB extends ITxnPOJOBase {
  from_account: null;
  from_category: ICategoryPOJO;
  to: Array<IBucketAmountAccount | IBucketAmountCategory>
}

export type ITxnPOJOIn = ITxnPOJOInA | ITxnPOJOInB;

export function isPOJOA(pojo: ITxnPOJOIn): pojo is ITxnPOJOInA {
  return pojo.from_account !== null;
}

export function isBucketAmountAccount(pojo: IBucketAmountAccount | IBucketAmountCategory): pojo is IBucketAmountAccount {
  return pojo.account !== null;
}

export interface ITxnPOJOOut extends ITxnPOJOBase {
  from_account_id: string | null;
  from_category_id: string | null;
  to: Array<{
    amount: number;
    account_id: string | null;
    category_id: string | null;
  }>
}

export default abstract class Transaction {
  public date: Date;
  public payee: string | null;
  public memo: string;
  public from: Category | Account;

  protected abstract type: txnTypes;

  protected _id: string | null;
  protected _to: Array<{amount: Amount; bucket: Category | Account}>;

  constructor(data: ITxnData) {
    this._id = data.id;
    this.date = data.date;
    this.payee = data.payee;
    this.memo = data.memo;
    this.from = data.from;
    this._to = data.to;

    this.postConstructor(data);
  }

  public addTo(event: {amount: Amount, bucket: Category | Account}) {
    this._to.push(event);
  }

  public errors(): string[] | null {
    if (this._to.length === 0) return ['You must send money to at least one bucket'];
    const errors = [
      this.amount.pennies === 0 && 'May not transfer $0',
      !this.from.name && 'You must select a "from" bucket',
      !this.from.id && 'Program error: from.id did not get set',
      this.to.filter((to) => to.amount.pennies === 0).length > 0 && 'All categories must have a non-zero balance',
      ...this.errorsExtra(),
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }

  public export(): ITxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from.name,
      to: this.to.map((to) => to.bucket.name).join('||'),
      memo: this.memo,
      type: this.type,
    };
  }

  get getFromName() {
    return this.from.name;
  }

  /*
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
  */

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

  protected postConstructor(_data: ITxnData) {
    return;
  }

  get amount() {
    return Amount.Pennies(
      -1 * this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0),
    );
  }
}
