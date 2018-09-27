import * as shortid from 'shortid';

import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {BankTxn as ClassicBankTxn} from './txns';
import * as Txns from './txns';
import {MoneyBucket, TxnExport} from './types';
import * as utils from './utils';

interface BTData {
  _id: string | null;
  date: Date;
  memo: string;
  payee: string;
  from: BucketReference;
  to: BucketAmount[];
  type?: string;
  // Legacy POJO values that we can ignore
  amount?: number | Txns.Pennies;
  account?: string;
  accountId?: string;
  categories?: any;
}

export default class BankTxn extends Transaction<TxnData & {payee: string}> {
  public static POJO(txn: ClassicBankTxn) {
    return new BankTxn({
      _id: txn._id,
      memo: txn.memo,
      payee: txn.payee,
      date: new Date(txn.date),
      to: txn.categories.map((category) =>
        BucketAmount.POJO({
          amount: category.amount,
          bucketRef: {id: category.id, name: category.name, type: 'category'},
        }),
      ),
      from: BucketReference.POJO({name: txn.account, id: txn.accountId, type: 'account'}),
    });
  }

  public static Empty() {
    return new BankTxn({
      _id: null,
      date: new Date(),
      memo: '',
      payee: '',
      from: BucketReference.Empty('account'),
      to: [],
    });
  }

  public payee: string = this.payee || '';

  protected type = 'banktxn';

  private _debitMode = false;

  public toPOJO(): ClassicBankTxn {
    return {
      _id: this.id,
      date: this.date.toJSON(),
      amount: this.amount.pennies as Txns.Pennies,
      payee: this.payee,
      account: this.from.name,
      accountId: this.from.id,
      memo: this.memo,
      categories: this._to.map((category) =>
        ({id: category.bucketId, name: category.bucketName, amount: category.amount.pennies as Txns.Pennies}),
      ),
      type: 'banktxn',
    };
  }

  public export(): TxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.to.map((category) => category.bucketName).join('||'),
      to: this.payee,
      memo: this.memo,
      type: 'banktxn',
    };
  }

  public addCategory(event: BucketAmount) {
    this._to.push(event);
  }

  public removeZeroCategories() {
    this._to = this._to.filter(
      ({amount}) => amount.pennies !== 0,
    );
  }

  public setFromByName(candidates: MoneyBucket[], name: string) {
    const bucket = candidates.find((candidate) => candidate.name === name);
    if (!bucket) throw new Error(`No matching bucket form "${name}"`);
    this.from = new BucketReference({name: bucket.name, id: bucket.id, type: bucket.type});
  }

  public setToByName(candidates: MoneyBucket[], name: string, index: number) {
    const bucket = candidates.find((candidate) => candidate.name === name);
    if (!bucket) throw new Error(`No matching bucket form "${name}"`);
    this.to[index] = new BucketAmount(
      this.to[index].amount,
      new BucketReference({name: bucket.name, id: bucket.id, type: bucket.type}),
    );
  }

  public errors(): string[] | null {
    const errors = [
      !this.payee && 'Payee is missing',
      !this.from.name && 'Account is missing',
      !this.from.id && 'Program error: Account ID did not get set',
      this.to.length === 0 && 'You must include at least one category',
      this.to.filter((category) => category.amount.pennies === 0).length > 0 &&
        'All categories must have a non-zero balance',
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }

  protected postConstructor(data: TxnData & {payee: string}) {
    this.payee = data.payee;
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
      ['txn', utils.formatDate(this.date), 'banktxn', this.payee, shortid.generate()].join('/')
    );
  }

  get to() {
    return this._to;
  }

  get debitMode() {
    return this._debitMode;
  }

  set debitMode(b: boolean) {
    if (this._debitMode !== b) {
      this._to.forEach((category) =>
        category.invertAmount(),
      );
    }
    this._debitMode = b;
  }

  get getFromName() {
    return this.from.name;
  }
}
