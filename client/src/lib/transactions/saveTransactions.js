import comparator from 'ramda/es/comparator';
import identity from 'ramda/es/identity';
import immer from 'immer';
import { get as storeGet } from 'svelte/store';

export default async function saveTransactions(
  { transactionsStore },
  dexie,
  newTxns
) {
  const existingTxns = storeGet(transactionsStore).filter(
    txn => txn.txn_id === newTxns[0].txn_id
  );
  const toDelete = existingTxns.filter(
    txn => newTxns.findIndex(t => t.id === txn.id) === -1
  );

  await Promise.all(toDelete.map(txn => dexie.transactions.delete(txn.id)));
  await Promise.all(newTxns.map(txn => dexie.transactions.put(txn)));

  transactionsStore.set(
    immer(
      (await dexie.transactions.toArray()).sort(
        comparator((a, b) => a.date > b.date)
      ),
      identity
    )
  );
}
