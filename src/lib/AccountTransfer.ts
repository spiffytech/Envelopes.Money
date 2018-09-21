import * as shortid from 'shortid';

import Amount from './Amount';
import {AccountTransfer as ClassicAccountTransfer} from './txns';
import * as Txns from './txns';
import {TxnExport} from './types';
import * as utils from './utils';

interface ATDATA {
  _id: string | null;
  amount: Amount;
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
      amount: Amount.Pennies(txn.amount),
      date: new Date(txn.date),
    });
  }

  public static Empty() {
    return new AccountTransfer({
      _id: null,
      amount: Amount.Pennies(0),
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
  public fromId: string;
  public toId: string;
  protected _id: string | null;
  protected txfrId: string;

  protected _debitMode = false;

  protected constructor(data: ATDATA) {
    this._id = data._id;
    this.amount = data.amount;
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

  public export(): TxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from,
      to: this.to,
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

  public errors(): string[] | null {
    const errors = [
      this.amount.pennies === 0 && 'May not transfer $0',
      !this.from && 'Must supply a "from" category',
      !this.to && 'Must supply a "to" category',
      !this.fromId && 'Program error: fromId did not get set',
      !this.toId && 'Program error: toId did not get set',
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }
}
