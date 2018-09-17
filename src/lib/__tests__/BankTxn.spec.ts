import BankTxn from '../BankTxn';
import * as Txns from '../txns';
import * as types from '../types';

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

it('Is assignable to the Txn interface', () => {
  const txn: types.Txn = BankTxn.Empty();
  expect(txn).not.toBe(null);  // A dummy use of txn to satisfy the linter
});

describe('Getters/setters', () => {
  it('Sums up items into the correct amount', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.amount.pennies).toBe(-500);
  });
});

describe('Handling credit/debit numbers', () => {
  it('Toggles numbers from negative to positive', () => {
    const txn = BankTxn.POJO(BTPOJO);
    console.log(txn.toPOJO());
    txn.debitMode = true;
    console.log(txn.toPOJO());
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
    txn.debitMode = true;
    expect(txn.amount.pennies).toBe(-500);
  });

  it('Toggling twice puts the numbers back to their original nign', () => {
    const txn = BankTxn.POJO(BTPOJO);
    txn.debitMode = true;
    /* tslint:disable-next-line:no-element-overwrite */
    txn.debitMode = false;
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

describe('Validation', () => {
  it('Accepts our sample POJO', () => {
    const txn = BankTxn.POJO(BTPOJO);
    expect(txn.validate()).toBe(true);
  });

  it('Rejects the empty object', () => {
    const txn = BankTxn.Empty();
    expect(txn.validate()).toBe(false);
  });

  it('Rejects when payee is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      payee: '',
    });
    expect(txn.validate()).toBe(false);
  });

  it('Rejects when account is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      account: '',
    });
    expect(txn.validate()).toBe(false);
  });

  it('Rejects when accountId is empty', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      accountId: '',
    });
    expect(txn.validate()).toBe(false);
  });

  it('Rejects when there are no categories', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      categories: [],
    });
    expect(txn.validate()).toBe(false);
  });

  it('Rejects when categories contain zero-amount items', () => {
    const txn = BankTxn.POJO({
      ...BTPOJO,
      categories: [
        ...BTPOJO.categories,
        {name: 'stuff', id: 'stuff again', amount: 0 as Txns.Pennies},
      ],
    });
    expect(txn.validate()).toBe(false);
  });
});
