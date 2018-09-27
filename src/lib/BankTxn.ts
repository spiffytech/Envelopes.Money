import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {BankTxn as ClassicBankTxn} from './txns';
import * as Txns from './txns';
import {TxnExport} from './types';
import * as utils from './utils';

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

  protected errorsExtra() {
    return [!this.payee && 'Payee must be filled in'].filter(utils.isString);
  }

  protected postConstructor(data: TxnData & {payee: string}) {
    this.payee = data.payee;
  }

  get getFromName() {
    return this.from.name;
  }
}
