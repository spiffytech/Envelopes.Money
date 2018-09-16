import Amount from '../Amount';
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

describe('Getters/setters', () => {
  it('Sums up items into the correct amount', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.amount.pennies).toBe(-500);
  });
});

describe('Handling credit/debit numbers', () => {
  it('Toggles numbers from negative to positive', () => {
    const txn = BankTxn.POJO(BTPOJO);
    txn.toggleDebit();
    expect(txn.amount.pennies).toBe(500);
  });

  it('Toggles numbers from positive to negative', () => {
    const pojo = {
      ...BTPOJO,
      categories: BTPOJO.categories.map((category) =>
        ({...category, amount: 250 as Txns.Pennies}),
      ),
    };
    const txn = BankTxn.POJO(pojo);
    txn.toggleDebit();
    expect(txn.amount.pennies).toBe(-500);
  });

  it('Toggling twice puts the numbers back to their original nign', () => {
    const txn = BankTxn.POJO(BTPOJO);
    txn.toggleDebit();
    txn.toggleDebit();
    expect(txn.amount.pennies).toBe(-500);
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
