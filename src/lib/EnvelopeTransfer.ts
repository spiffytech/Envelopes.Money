import Transaction from './Transaction';

export default class EnvelopeTransfer extends Transaction {
  protected type = 'envelopeTransfer' as 'envelopeTransfer';
}
