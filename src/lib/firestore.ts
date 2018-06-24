import firebase from 'firebase/app';
import 'firebase/firestore';
import R from 'ramda';

import {TxnItem} from './txns';

/* tslint:disable-next-line:no-var-requires */
const firebaseConfig = require('../firebase.config.json');
firebase.initializeApp(firebaseConfig);

/**
 * Returns a function that accepts an old balance and removes the given
 * transaction from that balance
 */
export function balanceUndoTxn(oldItem?: Pick<TxnItem, 'amount'>) {
  return R.when(
    R.always(Boolean(oldItem)),
    (balance: number) => R.add(R.negate(oldItem!.amount), balance)
  );
}

export function getNewBalance(oldBalance: number, amount: number, oldItem?: Pick<TxnItem, 'amount'>) {
  return R.curry(R.pipe(
    balanceUndoTxn(oldItem),
    R.add(amount)
  ))(oldBalance)
}

export async function updateAccountBalance(
  db: firebase.firestore.CollectionReference,
  txnItem: TxnItem,
  oldItem?: TxnItem
) {
  return firebase.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(db.doc(txnItem.account));
    if (!doc.exists) {
      return transaction.set(db.doc(txnItem.account), {balance: txnItem.amount});
    }
    const data = doc.data()!;

    const newBalance = getNewBalance(data.balance, txnItem.amount, oldItem);
    return transaction.update(db.doc(txnItem.account), {balance: newBalance});
  });
}