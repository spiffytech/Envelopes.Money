import * as shortid from 'shortid';

import Amount from './Amount';
import * as Txns from './txns';
import * as utils from './utils';

interface CatData {
  name: string;
  target: Amount;
  interval: 'weekly' | 'monthly' | 'yearly' | 'once';
  due?: Date;
  type?: 'category';
  _id: string | null;
}

export default class Category {
  public static POJO(category: Txns.Category, balance: Amount) {
    return new Category(
      {
        ...category,
        target: Amount.Pennies(category.target),
        due: category.due ? new Date(category.due) : undefined,
      },
      balance,
    );
  }

  public static Empty() {
    return new Category(
      {
        name: '',
        target: Amount.Pennies(0),
        interval: 'once',
        _id: null,
      },

      Amount.Pennies(0),
    );
  }

  public name: string;
  public target: Amount;
  public interval: 'weekly' | 'monthly' | 'yearly' | 'once';
  public due?: Date;
  private _id: string | null;

  private constructor(data: CatData, public balance: Amount) {
    this.name = data.name;
    this.target = data.target;
    this.interval = data.interval;
    this.due = data.due;
    this._id = data._id;
  }

  get dateString() {
    return this.due ? utils.formatDate(this.due) : '';
  }

  set dateString(d: string) {
    this.due = new Date(d);
  }

  get id() {
    return this._id || ['category', shortid.generate()].join('/');
  }

  public toPOJO(): Txns.Category {
    return {
      _id: this.id,
      name: this.name,
      target: this.target.pennies as Txns.Pennies,
      interval: this.interval,
      due: this.due ? this.due.toJSON() : this.due,
      type: 'category',
    };
  }
}
