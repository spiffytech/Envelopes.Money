import * as libtransactions from './Transactions.js';

/** @typedef {import('../types.d').TransactionWithAccounts} TransactionWithAccounts */
/** @typedef {import('../types.d').Account} Account */

describe('libtransactions', () => {
  /** @type {Account} */
  const from = {
    id: 'account1',
    name: 'Account 1',
    type: 'account',
  };
  /** @type {Account} */
  const to = {
    id: 'account2',
    name: 'Account 2',
    type: 'account',
  };

  it('groups transactions by txn_id', () => {
    /** @type {TransactionWithAccounts[]} */
    const transactions = [
      {
        from,
        to,
        transaction: {
          id: 'foo1',
          memo: null,
          date: '2019-11-22',
          amount: 50,
          label: '',
          from_id: 'abc',
          to_id: 'def',
          cleared: false,
          txn_id: '123',
        },
      },
      {
        from,
        to,
        transaction: {
          id: 'foo2',
          memo: null,
          date: '2019-11-22',
          amount: 50,
          label: '',
          from_id: 'abc',
          to_id: 'def',
          cleared: false,
          txn_id: '123',
        },
      },
      {
        from,
        to,
        transaction: {
          id: 'bar1',
          memo: null,
          date: '2019-11-22',
          amount: 50,
          label: '',
          from_id: 'abc',
          to_id: 'def',
          cleared: false,
          txn_id: '456',
        },
      },
    ];

    const actual = libtransactions.group(transactions);
    expect(actual.map(txns => txns.map(txn => txn.transaction.id))).toEqual([
      ['foo1', 'foo2'],
      ['bar1'],
    ]);
  });
});
