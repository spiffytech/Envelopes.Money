import Amount from './Amount';
import * as Txns from './txns';

interface CatData {
  name: string;
  target: Amount;
  interval: 'weekly' | 'monthly' | 'yearly' | 'once';
  due?: Date;
  type: 'category';
  _id: string;
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

  public name: string;
  public target: Amount;
  public interval: 'weekly' | 'monthly' | 'yearly' | 'once';
  public due?: Date;

  private constructor(data: CatData, public balance: Amount) {
    this.name = data.name;
    this.target = data.target;
    this.interval = data.interval;
    this.due = data.due;
  }
}
