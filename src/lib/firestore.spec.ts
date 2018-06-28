import * as firestore from './firestore';

describe('It selects a new account balance', () => {
  test('When passed a null old item', () => {
    expect(firestore.balanceUndoTxn(undefined)(5)).toBe(5);
  })

  test('It adds the old and new amounts together', () => {
    expect(firestore.balanceUndoTxn(5)(15)).toBe(10);
  })
});

describe('It adds the new amount to the blance', () => {
  test('When there\'s no oldItem', () => {
    expect(firestore.getNewBalance(15, 5)).toBe(20)
  });

  test('When there is an oldItem', () => {
    expect(firestore.getNewBalance(15, 5, 7)).toBe(13)
  });
});