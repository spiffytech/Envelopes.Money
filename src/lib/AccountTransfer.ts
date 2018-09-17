import * as shortid from 'shortid';

import Amount from './Amount';
import {AccountTransfer as ClassicAccountTransfer} from './txns';
import * as Txns from './txns';
import {EnvelopeEvent} from './types';
import * as utils from './utils';

interface ATDATA {
  _id: string | null;
  amount: number | Txns.Pennies;
  date: Date;
  memo: string;
  from: string;
  to: string;
  fromId: string;
  toId: string;
  txfrId: string;
  type?: string;
}

export default class AccountTransfer {
  public static POJO(txn: ClassicAccountTransfer) {
    return new AccountTransfer({
      ...txn,
      date: new Date(txn.date),
    });
  }

  public static Empty() {
    return new AccountTransfer({
      _id: null,
      amount: 0,
      date: new Date(),
      memo: '',
      from: '',
      to: '',
      fromId: '',
      toId: '',
      txfrId: '',
    });
  }

  public amount: Amount;
  public date: Date;
  public memo: string;
  public from: string;
  public to: string;
  private _id: string | null;
  private fromId: string;
  private toId: string;
  private txfrId: string;

  protected constructor(data: ATDATA) {
    this._id = data._id;
    this.amount = Amount.Pennies(data.amount);
    this.date = data.date;
    this.memo = data.memo;
    this.from = data.from;
    this.to = data.to;
    this.fromId = data.fromId;
    this.toId = data.toId;
    this.txfrId = data.txfrId;
  }

  public toPOJO(): ClassicAccountTransfer {
    return {
      _id: this.id,
      date: this.date.toJSON(),
      amount: this.amount.pennies as Txns.Pennies,
      memo: this.memo,
      from: this.from,
      to: this.to,
      fromId: this.fromId,
      toId: this.toId,
      txfrId: this.txfrId,
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

  public toggleDebit() {
    this.amount.pennies *= -1;
  }

  public validate() {
    return Boolean(
      this.amount.pennies !== 0 &&
      this.from &&
      this.to &&
      this.fromId &&
      this.toId &&
      this.txfrId,
    );
  }
}
