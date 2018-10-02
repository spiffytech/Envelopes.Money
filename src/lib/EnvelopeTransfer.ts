import Transaction from './Transaction';

export default class EnvelopeTransfer extends Transaction<any> {
  protected type = 'envelopeTransfer' as 'envelopeTransfer';
}
