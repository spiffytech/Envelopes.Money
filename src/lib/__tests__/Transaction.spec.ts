import BankTxn from '../BankTxn';
import * as Txns from '../txns';

const BTPOJO: Txns.BankTxn = {
  _id: 'aBogusTxn',
  payee: 'Target',
  account: 'Checking',
  accountId: 'abcd',
  date: '2018-09-15T23:59:59.000Z',
  memo: '',
  amount: -500 as Txns.Pennies,
  categories: [
    {name: 'Groceries', id: 'defg', amount: -200 as Txns.Pennies},
    {name: 'Home Supplies', id: 'hijk', amount: -300 as Txns.Pennies},
  ],
  type: 'banktxn',
};

describe('Validation', () => {
  it('Accepts our sample POJO', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.errors()).toBe(null);
  });

  it('Rejects the empty object', () => {
    const txn = BankTxn.Empty();
    expect(txn.errors()!.length).toBeGreaterThan(0);
  });

  it('Rejects when payee is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      payee: '',
    });
    expect(txn.errors()).toEqual(['Payee must be filled in']);
  });

  it('Rejects when account is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      account: '',
    });
    expect(txn.errors()).toEqual(['You must select a "from" bucket']);
  });

  it('Rejects when accountId is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      accountId: '',
    });
    expect(txn.errors()).toEqual(['Program error: from.id did not get set']);
  });

  it('Rejects when there are no categories', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      categories: [],
    });
    expect(txn.errors()).toEqual(['You must send money to at least one bucket']);
  });

  it('Rejects when categories contain zero-amount items', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      categories: [
        ...BTPOJO.categories,
        {name: 'stuff', id: 'stuff again', amount: 0 as Txns.Pennies},
      ],
    });
    expect(txn.errors()).toEqual(['All categories must have a non-zero balance']);
  });
});
