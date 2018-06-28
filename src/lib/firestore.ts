import bluebird from 'bluebird';
import firebase from 'firebase/app';
import 'firebase/firestore';
import * as R from 'ramda';

import * as Txns from './txns';
import {Account, DETxn } from './types';

global.Promise = bluebird;
(Promise as any).config({
  longStackTraces: true
})

/* tslint:disable-next-line:no-var-requires */
const firebaseConfig = require('../firebase.config.json');
firebase.initializeApp(firebaseConfig);
const settings = {timestampsInSnapshots: true};
firebase.firestore().settings(settings);

/**
 * Returns a function that accepts an old balance and removes the given
 * transaction from that balance
 */
export function balanceUndoTxn(oldAmount?: number) {
  return R.when(
    R.always(Boolean(oldAmount)),
    (balance: number) => R.add(R.negate(oldAmount!), balance)
  );
}

export function getNewBalance(oldBalance: number, amount: number, oldAmount?: number) {
  return R.pipe(
    balanceUndoTxn(oldAmount),
    R.add(amount)
  )(oldBalance)
}

export async function updateAccountBalance(
  db: firebase.firestore.CollectionReference,
  txnItem: Txns.TxnItem,
  oldItem?: Txns.TxnItem
) {
  return firebase.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(db.doc(encodeURIComponent(txnItem.account)));
    if (!doc.exists) {
      return transaction.set(
        db.doc(encodeURIComponent(txnItem.account)),
        {balance: txnItem.amount, name: txnItem.account} as Account
      );
    }
    const data = doc.data()!;

    const newBalance: number = getNewBalance(data.balance, txnItem.amount, oldItem ? oldItem.amount : undefined);
    return transaction.update(
      db.doc(encodeURIComponent(txnItem.account)),
      {balance: newBalance, name: txnItem.account} as Account
    );
  });
}

export async function updatePayee(
  db: firebase.firestore.CollectionReference,
  payee: string,
  oldItem?: string
) {
  return firebase.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(db.doc(encodeURIComponent(payee)));
    if (!doc.exists) {
      return transaction.set(
        db.doc(encodeURIComponent(payee)),
        {count: 1, name: payee}
      );
    }
    const data = doc.data()!;

    const newBalance: number = getNewBalance(data.count, 1);
    return transaction.update(
      db.doc(encodeURIComponent(payee)),
      {count: newBalance, name: payee}
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

export function listTxns(
  db: firebase.firestore.DocumentReference,
  sentinelDoc: firebase.firestore.QueryDocumentSnapshot | string | null,
  direction: 'prev' | 'next',
  onSnapshot: (docs: firebase.firestore.QueryDocumentSnapshot[]) => void,
): () => void {
  return (
    db.collection('txns').
    orderBy('date', direction === 'prev' ? 'asc' : 'desc').
    startAfter(sentinelDoc).
    limit(10).
    onSnapshot(
      R.pipe(
        (snapshot: firebase.firestore.QuerySnapshot) => {
          console.log('Txns read from cache?', snapshot.metadata.fromCache);
          return snapshot;
        },
        R.prop('docs'),
        R.when<firebase.firestore.QueryDocumentSnapshot[], firebase.firestore.QueryDocumentSnapshot[]>(
          R.always(R.equals(direction, 'prev')),
          R.reverse
        ),
        onSnapshot
      )
    )
  );
}