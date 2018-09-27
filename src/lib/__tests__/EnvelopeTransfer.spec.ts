import EnvelopeTransfer from '../EnvelopeTransfer';
import * as Txns from '../txns';
import * as types from '../types';

const ETPOJO: Txns.EnvelopeTransfer = {
  _id: 'stuff',
  date: new Date('2018-09-15 23:59:59').toJSON(),
  amount: 500 as Txns.Pennies,
  memo: '',
  from: {name: 'Savings', id: 'abcd', amount: 500 as Txns.Pennies},
  to: [
    {name: 'Vacations', id: 'defg', amount: 300 as Txns.Pennies},
    {name: 'Gas', id: 'hijk', amount: 200 as Txns.Pennies},
  ],
  type: 'envelopeTransfer',
};

it('Is assignable to the Txn interface', () => {
  const txn: types.Txn = EnvelopeTransfer.Empty();
  expect(txn).not.toBe(null);  // A dummy use of txn to satisfy the linter
});

describe('EnvelopeTransfers converting to/from POJO', () => {
  it('Returns an identical POJO to its constructor', () => {
    const transfer = EnvelopeTransfer.POJO(ETPOJO);
    expect(transfer.toPOJO()).toEqual(ETPOJO);
  });
});

describe('Date strings', () => {
  it('Converts to a date string', () => {
    const transfer = EnvelopeTransfer.POJO(ETPOJO);
    expect(transfer.dateString).toEqual('2018-09-15');
  });
});

describe('From an empty object', () => {
  it('Uses a generated ID if no ID has been given', () => {
    const transfer = EnvelopeTransfer.Empty();
    expect(transfer.id).toMatch(/txn\/[20\d{4}-\d{2}-\d{2}\/envelopeTransfer\/[a-zA-Z0-9]+/);
  });
});
