import clone from 'ramda/es/clone';

import * as libtransactions from './Transactions.js';
import o from 'ramda/es/o';

/** @typedef {import('../types.d').Transaction} Transaction*/
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

  /** @type {TransactionWithAccounts} */
  const txnWithA = {
    from,
    to,
    transaction: {
      id: 'foo1',
      memo: null,
      date: '2019-11-22',
      amount: 50,
      label: 'Foo Co.',
      from_id: 'abc',
      to_id: 'def',
      cleared: false,
      txn_id: '456',
      type: 'banktxn',
    }
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
      const actual = libtransactions.txnId(txnWithA);

      expect(actual).toBe('456');
    });
  });

  describe('fromAccountId', () => {
    it('returns the from account ID', () => {
      expect(libtransactions.fromAccountId(txnWithA)).toBe(from.id);
    });
  });

  describe('toAccountId', () => {
    it('returns the to account ID', () => {
      expect(libtransactions.toAccountId(txnWithA)).toBe(to.id);
    });
  });

  describe('filterByAccount', () => {
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

  describe('friendlyTypeName', () => {
    it('Returns correctly for bank transactions', () => {
      expect(libtransactions.friendlyTypeName(txnWithA)).toBe('Bank Transaction');
    });

    it('Returns correctly for envelope transfers', () => {
      const envelopeTransfer = clone(txnWithA);
      envelopeTransfer.transaction.type = 'envelopeTransfer';
      expect(libtransactions.friendlyTypeName(envelopeTransfer)).toBe('Envelope Transfer');
    });

    it('Returns correctly for account transfers', () => {
      const envelopeTransfer = clone(txnWithA);
      envelopeTransfer.transaction.type = 'accountTransfer';
      expect(libtransactions.friendlyTypeName(envelopeTransfer)).toBe('Account Transfer');
    });
  });
  
  describe('date', () => {
    it('returns the right date', () => {
      expect(libtransactions.date(txnWithA)).toBe('2019-11-22');
    });
  });
  
  describe('label', () => {
    it('returns the right label', () => {
      expect(libtransactions.label(txnWithA)).toBe('Foo Co.');
    });
  });

  describe('amonut', () => {
    it('returns the right amount', () => {
      expect(libtransactions.amount(txnWithA)).toBe(50);
    });
  });

  describe('mkEmptyTransaction', () => {
    const txn = libtransactions.mkEmptyTransaction();

    it('prefixes the ID with "transaction/"', () => {
      expect(txn.id.startsWith('transaction/')).toBeTruthy();
    });

    it('returns an empty memo', () => {
      expect(txn.memo).toBe('');
    });

    it('returns a properly formatted date', () => {
      expect(/\d{4}-\d{2}-\d{2}/.test(txn.date)).toBeTruthy()
    });

    it('returns a zero amount', () => {
      expect(txn.amount).toBe(0);
    });

    it('returns an empty label', () => {
      expect(txn.label).toBeNull();
    });

    it('defaults to uncleared', () => {
      expect(txn.cleared).toBeFalsy();
    });

    it('does not fill in to/from IDs', () => {
      expect(/** @type {Partial<Transaction>} */ (txn).from_id).toBeUndefined();
      expect(/** @type {Partial<Transaction>} */ (txn).to_id).toBeUndefined();
    });
  });
});
