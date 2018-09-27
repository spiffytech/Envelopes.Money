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

describe('Validation', () => {
  it('Accepts our sample POJO', () => {
    const txn = AccountTransfer.POJO(ATPOJO);
    expect(txn.errors()).toBe(null);
  });

  it('Rejects the empty object', () => {
    const txn = AccountTransfer.Empty();
    expect(txn.errors()!.length).toBeGreaterThan(0);
  });

  it('Rejects if the amount is zero', () => {
    const txn = AccountTransfer.POJO({
      ...ATPOJO,
      amount: 0 as Txns.Pennies,
    });

    expect(txn.errors()).toEqual(['May not transfer $0']);
  });

  it('Rejects if "from" is not set', () => {
    const txn = AccountTransfer.POJO({
      ...ATPOJO,
      from: '',
    });

    expect(txn.errors()).toEqual(['Must supply a "from" category']);
  });

  it('Rejects if "to" is not set', () => {
    const txn = AccountTransfer.POJO({
      ...ATPOJO,
      to: '',
    });

    expect(txn.errors()).toEqual(['Must supply a "to" category']);
  });

  it('Rejects if "fromId" is not set', () => {
    const txn = AccountTransfer.POJO({
      ...ATPOJO,
      fromId: '',
    });

    expect(txn.errors()).toEqual(['Program error: fromId did not get set']);
  });

  it('Rejects if "toId" is not set', () => {
    const txn = AccountTransfer.POJO({
      ...ATPOJO,
      toId: '',
    });

    expect(txn.errors()).toEqual(['Program error: toId did not get set']);
  });
});
