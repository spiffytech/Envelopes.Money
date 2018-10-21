import Transaction from './Transaction';
import * as utils from './utils';

export default class BankTxn extends Transaction {
  public payee: string = this.payee || '';

  protected type = 'banktxn' as 'banktxn';

  protected errorsExtra() {
    return [!this.payee && 'Payee must be filled in'].filter(utils.isString);
  }

  get getFromName() {
    return this.from.name;
  }
}
