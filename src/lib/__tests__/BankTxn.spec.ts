import Amount from '../Amount';
import BankTxn from '../BankTxn';
import * as Txns from '../txns';
import * as Types from '../types';

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

it('Sets the payee', () => {
  const txn = BankTxn.POJO(BTPOJO);
  expect(txn.payee).toBe('Target');
});

describe('Getters/setters', () => {
  it('Sums up items into the correct amount', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.amount.pennies).toBe(-500);
  });

  it('Categories total to the same as "amount"', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(
      txn.to.map((category) => category.amount.pennies).reduce((a, b) => a + b, 0),
    ).toBe(txn.amount.pennies);
  });
});

describe('Serializing', () => {
  // The reduce in `amount` didn't have a default value, so this test would have
  // failed
  it('Can serialize an empty object', () => {
    const txn = BankTxn.Empty();
    txn.toPOJO();
  });

  it('Returns the same object we put in', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.toPOJO()).toEqual(BTPOJO);
  });
});

describe('Handling "from"', () => {
  it('Returns the name of the "from" reference', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.getFromName).toBe('Checking');
  });

  it('Sets the "from" object based on the name of the new account', () => {
    const txn = BankTxn.POJO(BTPOJO);
    const buckets: Types.MoneyBucket[] = [
      {name: 'Checking', id: 'checking1', amount: Amount.Pennies(0), type: 'account'},
      {name: 'Savings', id: 'savings1', amount: Amount.Pennies(0), type: 'account'},
      {name: 'Investment', id: 'investment', amount: Amount.Pennies(0), type: 'account'},
    ];
    txn.setFromByName(buckets, 'Savings');
    expect(txn.from.name).toBe('Savings');
    expect(txn.from.id).toBe('savings1');
  });

  it('Throws an error if there is no match for "from"', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(() => txn.setFromByName([], 'Savings')).toThrow();
  });
});
