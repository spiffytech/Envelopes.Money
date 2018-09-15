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
  _id: string;
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

  protected constructor(private data: ETData) {}

  public toPOJO(): ClassicEnvelopeTransfer {
    return {
      _id: this.data._id,
      date: this.data.date.toJSON(),
      amount: this.data.from.amount.pennies as Txns.Pennies,
      memo: this.data.memo,
      from: {...this.data.from, amount: this.data.from.amount.pennies as Txns.Pennies},
      to: this.data.to.map((to) =>
        ({...to, amount: to.amount.pennies as Txns.Pennies}),
      ),
      type: 'envelopeTransfer',
    };
  }

  get dateString() {
    return utils.formatDate(this.data.date);
  }

  set dateString(d: string) {
    this.data.date = new Date(d);
  }
}
