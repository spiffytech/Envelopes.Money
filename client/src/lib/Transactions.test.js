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

  describe('group', () => {
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
            type: 'banktxn',
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
            type: 'banktxn',
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
            type: 'banktxn',
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

  describe('txnId', () => {
    it('returns the txn_id of a transaction', () => {
      /** @type {TransactionWithAccounts} */
      const txnWithA = {
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
          txn_id: '456',
          type: 'banktxn',
        }
      };

      const actual = libtransactions.txnId(txnWithA);

      expect(actual).toBe('456');
    });
  });

  describe('fromAccountId', () => {
    it('returns the from account ID', () => {
      /** @type {TransactionWithAccounts} */
      const txnWithA = {
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
          txn_id: '456',
          type: 'banktxn',
        }
      };

      expect(libtransactions.fromAccountId(txnWithA)).toBe(from.id);
    });
  });

  describe('toAccountId', () => {
    it('returns the to account ID', () => {
      /** @type {TransactionWithAccounts} */
      const txnWithA = {
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
          txn_id: '456',
          type: 'banktxn',
        }
      };

      expect(libtransactions.toAccountId(txnWithA)).toBe(to.id);
    });
  });

  describe('filterByAccount', () => {
    /** @type {TransactionWithAccounts} */
    const txnWithA = {
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
        txn_id: '456',
        type: 'banktxn',
      }
    };

    it('returns true if there is not account provided', () => {
      expect(libtransactions.filterByAccount(null, txnWithA)).toBeTruthy();
    });

    it('returns true if the from account matches', () => {
      expect(libtransactions.filterByAccount(from.id, txnWithA)).toBeTruthy();
    });

    it('returns true if the to account matches', () => {
      expect(libtransactions.filterByAccount(to.id, txnWithA)).toBeTruthy();
    });

    it('returns false if we request an ID that does not match', () => {
      expect(libtransactions.filterByAccount('bogus', txnWithA)).toBeFalsy();
    });
  });
});
