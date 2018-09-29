import BucketAmount from './BucketAmount';
import BucketReference from './BucketReference';
import Transaction from './Transaction';
import {TxnData, TxnPOJO} from './Transaction';
import {TxnExport} from './types';
import * as utils from './utils';

export default class BankTxn extends Transaction<TxnData & {payee: string}> {
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

  protected pojoExtra(pojo: TxnPOJO) {
    return {...pojo, payee: this.payee};
  }

  get getFromName() {
    return this.from.name;
  }
}
