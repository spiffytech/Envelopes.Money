import AccountTransfer from '../AccountTransfer';
import * as Txns from '../txns';
import * as types from '../types';

const ATPOJO: Txns.AccountTransfer = {
  _id: 'stuff',
  date: new Date('2018-09-15 23:59:59').toJSON(),
  amount: 500 as Txns.Pennies,
  memo: '',
  from: 'Savings',
  to: 'Vacations',
  fromId: 'abcd',
  toId: 'defg',
  type: 'accountTransfer',
};

it('Is assignable to the Txn interface', () => {
  const txn: types.Txn = AccountTransfer.Empty();
  expect(txn).not.toBe(null);  // A dummy use of txn to satisfy the linter
});

describe('AccountTransfers converting to/from POJO', () => {
  it('Returns an identical POJO to its constructor', () => {
    const transfer = AccountTransfer.POJO(ATPOJO);
    expect(transfer.toPOJO()).toEqual(ATPOJO);
  });
});

describe('Date strings', () => {
  it('Converts to a date string', () => {
    const transfer = AccountTransfer.POJO(ATPOJO);
    expect(transfer.dateString).toEqual('2018-09-15');
  });
});

describe('From an empty object', () => {
  it('Uses a generated ID if no ID has been given', () => {
    const transfer = AccountTransfer.Empty();
    expect(transfer.id).toMatch(/txn\/[20\d{4}-\d{2}-\d{2}\/envelopeTransfer\/[a-zA-Z0-9]+/);
  });
});
