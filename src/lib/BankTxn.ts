import Transaction from './Transaction';
import {TxnData} from './Transaction';
import {TxnExport} from './types';
import * as utils from './utils';

export default class BankTxn extends Transaction<{payee: string}> {
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

  protected exportExtra(data: TxnExport) {
    return {...data, payee: this.payee};
  }

  protected postConstructor(data: TxnData<{payee: string}>) {
    this.payee = data.extra.payee;
  }

  protected extraPOJO() {
    return {payee: this.payee};
  }

  get getFromName() {
    return this.from.name;
  }
}
