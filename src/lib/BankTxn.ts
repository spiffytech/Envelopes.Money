import * as shortid from 'shortid';

import Amount from './Amount';
import {BankTxn as ClassicBankTxn} from './txns';
import * as Txns from './txns';
import {EnvelopeEvent} from './types';
import * as utils from './utils';

interface BTData {
  _id: string | null;
  date: Date;
  memo: string;
  payee: string;
  account: string;
  accountId: string;
  categories: EnvelopeEvent[];
}

export default class BankTxn {
  public static POJO(txn: ClassicBankTxn) {
    return new BankTxn({
      _id: txn._id,
      date: new Date(txn.date),
      memo: txn.memo,
      payee: txn.payee,
      account: txn.account,
      accountId: txn.accountId,
      categories: txn.categories.map((category) =>
        ({...category, amount: Amount.Pennies(category.amount)}),
      ),
    });
  }

  public static Empty() {
    return new BankTxn({
      _id: null,
      date: new Date(),
      memo: '',
      payee: '',
      account: '',
      accountId: '',
      categories: [],
    });
  }

  public account: string;
  public accountId: string;
  public date: Date;
  public memo: string;
  public payee: string;
  private _id: string | null;
  private _categories: EnvelopeEvent[] = [];

  protected constructor(data: BTData) {
    this._id = data._id;
    this.payee = data.payee;
    this.account = data.account;
    this.accountId = data.accountId;
    this.date = data.date;
    this.memo = data.memo;
    this._categories = data.categories;
  }

  public toPOJO(): ClassicBankTxn {
    return {
      _id: this.id,
      date: this.date.toJSON(),
      amount: this.amount.pennies as Txns.Pennies,
      payee: this.payee,
      account: this.account,
      accountId: this.accountId,
      memo: this.memo,
      categories: this._categories.map((category) =>
        ({...category, amount: category.amount.pennies as Txns.Pennies}),
      ),
      type: 'banktxn',
    };
  }

  get amount(): Amount {
    const pennies = (
      this._categories.
      map((category) => category.amount.pennies).
      reduce((a, b) => a + b, 0)
    );

    return Amount.Pennies(pennies);
  }

  get categories() {
    return this._categories;
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

  public addCategory(event: EnvelopeEvent) {
    this._categories.push(event);
  }

  public removeZeroCategories() {
    this._categories = this._categories.filter(
      ({amount}) => amount.pennies !== 0,
    );
  }

  public toggleDebit() {
    this._categories = this._categories.map((category) =>
      ({...category, amount: Amount.Pennies(category.amount.pennies * -1)}),
    );
  }
}
