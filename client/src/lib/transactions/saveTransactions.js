import bencode from 'bencode';
import comparator from 'ramda/es/comparator';
import identity from 'ramda/es/identity';
import immer from 'immer';
import shajs from 'sha.js';
import { get as storeGet } from 'svelte/store';

export default async function saveTransactions(
  { transactionsStore },
  dexie,
  newTxns
) {
  const txnsWithFingerprint = newTxns.map(txn => ({
    ...txn,
    _fingerprint: shajs('sha256')
      .update(bencode.encode(JSON.stringify(txn)))
      .digest('hex'),
  }));

  const existingTxns = storeGet(transactionsStore).filter(
    txn => txn.txn_id === txnsWithFingerprint[0].txn_id
  );
  const toDelete = existingTxns.filter(
    txn => txnsWithFingerprint.findIndex(t => t.id === txn.id) === -1
  );

  await Promise.all(toDelete.map(txn => dexie.transactions.delete(txn.id)));
  await Promise.all(
    txnsWithFingerprint.map(txn => dexie.transactions.put(txn))
  );

  transactionsStore.set(
    immer(
      (await dexie.transactions.toArray()).sort(
        comparator((a, b) => a.date > b.date)
      ),
      identity
    )
  );
}
