import Transaction from './Transaction';

export default class AccountTransfer extends Transaction {
  protected type = 'accountTransfer' as 'accountTransfer';
}
