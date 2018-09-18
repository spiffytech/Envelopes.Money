import * as shortid from 'shortid';

import Amount from './Amount';
import {EnvelopeTransfer as ClassicEnvelopeTransfer} from './txns';
import * as Txns from './txns';
import {EnvelopeEvent, TxnExport} from './types';
import * as utils from './utils';

interface ETData {
  _id: string | null;
  date: Date;
  memo: string;
  from: EnvelopeEvent;
  to: EnvelopeEvent[];
}

export default class EnvelopeTransfer {
  public static POJO(txn: ClassicEnvelopeTransfer) {
    return new EnvelopeTransfer({
      _id: txn._id,
      date: new Date(txn.date),
      memo: txn.memo,
      from: {...txn.from, amount: Amount.Pennies(txn.from.amount)},
      to: txn.to.map((to) =>
        ({...to, amount: Amount.Pennies(to.amount)}),
      ),
    });
  }

  public static Empty() {
    return new EnvelopeTransfer({
      _id: null,
      date: new Date(),
      memo: '',
      from: {name: '', id: '', amount: Amount.Pennies(0)},
      to: [],
    });
  }

  public date: Date;
  public memo: string;
  public from: EnvelopeEvent;
  private _id: string | null;
  private _to: EnvelopeEvent[] = [];

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
      amount: this.from.amount.pennies as Txns.Pennies,
      memo: this.memo,
      from: {...this.from, amount: this.from.amount.pennies as Txns.Pennies},
      to: this._to.map((to) =>
        ({...to, amount: to.amount.pennies as Txns.Pennies}),
      ),
      type: 'envelopeTransfer',
    };
  }

  public export(): TxnExport {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from.name,
      to: this.to.map((to) => to.name).join('||'),
      memo: this.memo,
      type: 'envelopeTransfer',
    };
  }

  get amount(): Amount {
    return this.from.amount;
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
    if (this._debitMode !== b) this.from.amount.pennies *= -1;
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
    this._to.push(event);
  }

  public errors(): string[] | null {
    const errors = [
      this.from.amount.pennies === 0 && 'May not transfer $0',
      this._to.length === 0 && 'Must move money to at least one category',
      this._to.filter((to) => to.amount.pennies === 0).length > 0 && 'All movement must have a non-zero amount',
      this.from.amount.pennies !==
        this._to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0) &&
        '"from" and "to" amounts don\'t match',
    ].filter(utils.isString);
    return errors.length > 0 ? errors : null;
  }
}
