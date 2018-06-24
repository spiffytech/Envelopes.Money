import firebase from 'firebase/app';
import 'firebase/firestore';
import * as R from 'ramda';

import * as Txns from './txns';
import {Account, DETxn } from './types';

/* tslint:disable-next-line:no-var-requires */
const firebaseConfig = require('../firebase.config.json');
firebase.initializeApp(firebaseConfig);
const settings = {timestampsInSnapshots: true};
firebase.firestore().settings(settings);

/**
 * Returns a function that accepts an old balance and removes the given
 * transaction from that balance
 */
export function balanceUndoTxn(oldItem?: Pick<Txns.TxnItem, 'amount'>) {
  return R.when(
    R.always(Boolean(oldItem)),
    (balance: number) => R.add(R.negate(oldItem!.amount), balance)
  );
}

export function getNewBalance(oldBalance: number, amount: number, oldItem?: Pick<Txns.TxnItem, 'amount'>) {
  return R.pipe(
    balanceUndoTxn(oldItem),
    R.add(amount)
  )(oldBalance)
}

export async function updateAccountBalance(
  db: firebase.firestore.CollectionReference,
  txnItem: Txns.TxnItem,
  oldItem?: Txns.TxnItem
) {
  return firebase.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(db.doc(txnItem.account));
    if (!doc.exists) {
      return transaction.set(
        db.doc(txnItem.account),
        {balance: txnItem.amount, name: txnItem.account} as Account
      );
    }
    const data = doc.data()!;

    const newBalance: number = getNewBalance(data.balance, txnItem.amount, oldItem);
    return transaction.update(
      db.doc(txnItem.account),
      {balance: newBalance, name: txnItem.account} as Account
    );
  });
}

export function watchTransactions(
  db: firebase.firestore.DocumentReference,
  store: {addTxns(docs: DETxn[]): void, clearTxns(): void}
) {
  /* tslint:disable:no-console */
  return db.collection('txns').
  orderBy('date', 'desc').
  onSnapshot((snapshot) => {
    console.log('Snapshots came from cache?', snapshot.metadata.fromCache);
    store.clearTxns();
    const docs = snapshot.docs.map((doc) => doc.data());
    store.addTxns(docs as Txns.DETxn[]);
    console.log('Adding docs', docs.length)
  });
  /* tslint:disable:no-console */
}

export function watchAccounts(
  db: firebase.firestore.DocumentReference,
  store: {setAllAccounts(accounts: Account[]): void}
){
  return db.collection('accounts').
  onSnapshot((snapshot) => {
    console.log('Accounts read from cache?', snapshot.metadata.fromCache);
    const accounts = snapshot.docs.map((doc) => doc.data() as Account);
    store.setAllAccounts(accounts);
  });
}