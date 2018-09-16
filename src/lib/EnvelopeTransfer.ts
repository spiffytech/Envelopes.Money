import * as shortid from 'shortid';

import Amount from './Amount';
import {EnvelopeTransfer as ClassicEnvelopeTransfer} from './txns';
import * as Txns from './txns';
import * as utils from './utils';

interface EnvelopeEvent {
  name: string;
  id: string;
  amount: Amount;
}

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

  get to() {
    return this._to;
  }

  public addTo(event: EnvelopeEvent) {
    this._to.push(event);
  }
}
