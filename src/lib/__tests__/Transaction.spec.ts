import Amount from '../Amount';
import BankTxn from '../BankTxn';
import {TxnPOJO} from '../Transaction';
import transactionFactory from '../TransactionFactory';
import * as Types from '../types';

const POJO: TxnPOJO & {payee: string} = {
  _id: 'aBogusTxn',
  payee: 'Target',
  from: {id: 'abcd', name: 'Checking', type: 'account'},
  date: '2018-09-15T23:59:59.000Z',
  memo: '',
  amount: -500,
  to: [
    {amount: 200, bucketRef: {name: 'Groceries', id: 'defg', type: 'category'}},
    {amount: 300, bucketRef: {name: 'Home Supplies', id: 'hijk', type: 'category'}},
  ],
  type: 'banktxn',
  extra: {},
};

it('Sets the payee', () => {
  const txn = transactionFactory(POJO);
  expect((txn as any).payee).toBe('Target');
});

describe('From an empty object', () => {
  it('Uses a generated ID if no ID has been given', () => {
    const transfer = transactionFactory({...POJO, _id: ''});
    expect(transfer.id).toMatch(/txn\/[20\d{4}-\d{2}-\d{2}\/envelopeTransfer\/[a-zA-Z0-9]+/);
  });
});

describe('Getters/setters', () => {
  it('Sums up items into the correct amount', () => {
    const txn = transactionFactory(POJO);
    expect(txn.amount.pennies).toBe(-500);
  });

  it('Total amount and "to" sum to zero', () => {
    const txn = transactionFactory(POJO);
    const amount = txn.amount.pennies;
    const toAmount = txn.to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0);
    expect(amount + toAmount).toBe(0);
  });
});

describe('Serializing', () => {
  it('Returns the same object we put in', () => {
    const txn = transactionFactory(POJO);
    expect(txn.toPOJO()).toEqual(POJO);
  });
});

describe('Handling "from"', () => {
  it('Returns the name of the "from" reference', () => {
    const txn = transactionFactory(POJO);
    expect(txn.getFromName).toBe('Checking');
  });

  it('Sets the "from" object based on the name of the new account', () => {
    const txn = transactionFactory(POJO);
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
    const txn = transactionFactory(POJO);
    expect(() => txn.setFromByName([], 'Savings')).toThrow();
  });
});
describe('Validation', () => {
  it('Accepts our sample POJO', () => {
    const txn = transactionFactory(POJO);
    expect(txn.errors()).toBe(null);
  });

  it('Rejects the empty object', () => {
    const txn = BankTxn.Empty();
    expect(txn.errors()!.length).toBeGreaterThan(0);
  });

  it('Rejects when payee is empty', () => {
    const txn = transactionFactory({
      ...POJO,
      payee: '',
    });
    expect(txn.errors()).toEqual(['Payee must be filled in']);
  });

  it('Rejects when account is empty', () => {
    const txn = transactionFactory({...POJO, from: {...POJO.from, name: ''}});
    expect(txn.errors()).toEqual(['You must select a "from" bucket']);
  });

  it('Rejects when accountId is empty', () => {
    const txn = transactionFactory({...POJO, from: {...POJO.from, id: ''}});
    expect(txn.errors()).toEqual(['Program error: from.id did not get set']);
  });

  it('Rejects when there are no categories', () => {
    const txn = transactionFactory({
      ...POJO,
      to: [],
    });
    expect(txn.errors()).toEqual(['You must send money to at least one bucket']);
  });

  it('Rejects when categories contain zero-amount items', () => {
    const txn = transactionFactory({
      ...POJO,
      to: [
        ...POJO.to,
        {amount: 0, bucketRef: {name: 'stuff', id: 'stuff again', type: 'category'}},
      ],
    });
    expect(txn.errors()).toEqual(['All categories must have a non-zero balance']);
  });
});
