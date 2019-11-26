import clone from 'ramda/es/clone';

import * as libtxngroup from './transactionGroup';

/** @typedef {import('../types.d').Account} Account */
/** @typedef {import('../types.d').TransactionGroup} TransactionGroup */

describe('libtxngroup', () => {
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
  /** @type {Account} */
  const to2 = {
    id: 'account3',
    name: 'Account 3',
    type: 'account',
  };

  /** @type {TransactionGroup} */
  const txnGroup = [
    {
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
      },
    },
    {
      from,
      to: to2,
      transaction: {
        id: 'foo2',
        memo: null,
        date: '2019-11-22',
        amount: 75,
        label: 'Foo Co.',
        from_id: 'abc',
        to_id: 'def',
        cleared: false,
        txn_id: '456',
        type: 'banktxn',
      },
    },
  ];

  it("returns a txngroup's txn id", () => {
    expect(libtxngroup.txnId(txnGroup)).toBe('456');
  });

  it('returns the right date', () => {
    expect(libtxngroup.date(txnGroup)).toBe('2019-11-22');
  });

  it('returns the right amount', () => {
    expect(libtxngroup.amount(txnGroup)).toBe(125);
  });

  it('returns the label if present', () => {
    expect(libtxngroup.labelOrLabel(txnGroup)).toBe('Foo Co.');
  });

  it('returns the txn type if no label is present', () => {
    const txnGroup2 = clone(txnGroup);
    txnGroup2[0].transaction.label = null;
    txnGroup2[1].transaction.label = null;
    expect(libtxngroup.labelOrLabel(txnGroup2)).toBe('Bank Transaction');
  });

  it('returns the "from" name', () => {
    expect(libtxngroup.fromName(txnGroup)).toBe('Account 1');
  });

  it('returns the "to" names joined with a comma', () => {
    expect(libtxngroup.toNames(txnGroup)).toEqual(['Account 2', 'Account 3']);
  });

  describe('filter', () => {
    it('returns true if no terms are provided', () => {
      expect(
        libtxngroup.filter({ account: null, envelope: null, term: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns true if the account matches the from', () => {
      expect(
        libtxngroup.filter({ account: 'Account 1', envelope: null, term: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns true if the account matches the to', () => {
      expect(
        libtxngroup.filter({ account: 'Account 2', envelope: null, term: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns false if the account does not match', () => {
      expect(
        libtxngroup.filter({ account: 'Account 4', envelope: null, term: '' })(
          txnGroup
        )
      ).toBeFalsy();
    });

    it('returns true if the envelope matches the from', () => {
      expect(
        libtxngroup.filter({ envelope: 'Account 1', account: null, term: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns true if the envelope matches the to', () => {
      expect(
        libtxngroup.filter({ envelope: 'Account 2', account: null, term: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns false if the envelope does not match', () => {
      expect(
        libtxngroup.filter({ envelope: 'Account 4', account: null, term: '' })(
          txnGroup
        )
      ).toBeFalsy();
    });

    it('returns true if the search term matches the from', () => {
      expect(
        libtxngroup.filter({ term: 'Account 1', account: null, envelope: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns true if the search term matches the to', () => {
      expect(
        libtxngroup.filter({ term: 'Account 2', account: null, envelope: '' })(
          txnGroup
        )
      ).toBeTruthy();
    });

    it('returns false if the search term does not match', () => {
      expect(
        libtxngroup.filter({ term: 'Account 4', account: null, envelope: '' })(
          txnGroup
        )
      ).toBeFalsy();
    });
  });
});
