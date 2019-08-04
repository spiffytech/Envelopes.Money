import comparator from 'ramda/es/comparator';
import identity from 'ramda/es/identity';
import immer from 'immer';
import { get as storeGet } from 'svelte/store';

export default async function saveTransactions(
  { transactionsStore },
  { transactionsColl },
  newTxns
) {
  const existingTxns = storeGet(transactionsStore).filter(
    txn => txn.txn_id === newTxns[0].txn_id
  );
  const toDelete = existingTxns.filter(
    txn => newTxns.findIndex(t => t.id === txn.id) === -1
  );

  await Promise.all(toDelete.map(txn => transactionsColl.delete(txn.id)));
  await Promise.all(newTxns.map(txn => transactionsColl.upsert(txn)));

  transactionsStore.set(
    immer(
      (await transactionsColl.list()).data.sort(
        comparator((a, b) => a.date > b.date)
      ),
      identity
    )
  );
}
