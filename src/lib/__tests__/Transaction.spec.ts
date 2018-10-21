import Account from '../Account';
import Amount from '../Amount';
import Category from '../Category';
import {ITxnData} from '../Transaction';
import transactionFactory from '../TransactionFactory';
import {Empty} from '../TransactionFactory';

const txnData: ITxnData = {
  id: 'aBogusTxn',
  from: new Account({id: 'abcd', name: 'Checking'}),
  date: new Date('2018-09-15T23:59:59.000Z'),
  memo: '',
  to: [
    {amount: Amount.Pennies(200), bucket: Category.POJO({name: 'Groceries', id: 'defg', target: 500, interval: 'weekly'})},
    {amount: Amount.Pennies(300), bucket: Category.POJO({name: 'Home Supplies', id: 'hijk', target: 500, interval: 'weekly'})},
  ],
  payee: 'Target',
};

it('Sets the payee', () => {
  const txn = transactionFactory(txnData, 'banktxn');
  expect((txn as any).payee).toBe('Target');
});

describe('From an empty object', () => {
  it('Uses a generated ID if no ID has been given', () => {
    const transfer = transactionFactory({...txnData, id: ''}, 'banktxn');
    expect(transfer.id).toMatch(/txn\/[20\d{4}-\d{2}-\d{2}\/envelopeTransfer\/[a-zA-Z0-9]+/);
  });
});

describe('Getters/setters', () => {
  it('Sums up items into the correct amount', () => {
    const txn = transactionFactory(txnData, 'banktxn');
    expect(txn.amount.pennies).toBe(-500);
  });

  it('Total amount and "to" sum to zero', () => {
    const txn = transactionFactory(txnData, 'banktxn');
    const amount = txn.amount.pennies;
    const toAmount = txn.to.map((to) => to.amount.pennies).reduce((a, b) => a + b, 0);
    expect(amount + toAmount).toBe(0);
  });
});

describe('Validation', () => {
  it('Accepts our sample POJO', () => {
    const txn = transactionFactory(txnData, 'banktxn');
    expect(txn.errors()).toBe(null);
  });

  it('Rejects the empty object', () => {
    const txn = Empty('banktxn', new Account({id: '', name: ''}));
    expect(txn.errors()!.length).toBeGreaterThan(0);
  });

  it('Rejects when payee is empty', () => {
    const txn = transactionFactory({...txnData, payee: null}, 'banktxn');
    expect(txn.errors()).toEqual(['Payee must be filled in']);
  });

  it('Rejects when accountId is empty', () => {
    const txn = transactionFactory({...txnData, from: {...txnData.from, id: ''}}, 'banktxn');
    expect(txn.errors()).toEqual(['Program error: from.id did not get set']);
  });

  it('Rejects when there are no categories', () => {
    const txn = transactionFactory({...txnData, to: []}, 'banktxn');
    expect(txn.errors()).toEqual(['You must send money to at least one bucket']);
  });

  it('Rejects when categories contain zero-amount items', () => {
    const txn = transactionFactory(
      {
        ...txnData,
        to: [
          ...txnData.to,
          {amount: Amount.Pennies(0), bucket: Category.POJO({name: 'stuff', id: 'stuff again', interval: 'weekly', target: 500})},
        ],
      },
      'banktxn'
    );
    expect(txn.errors()).toEqual(['All categories must have a non-zero balance']);
  });
});
