import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import TxnGrouped from './TxnGrouped';
import * as cache from '../lib/cache';
import * as ITxnGrouped from '../lib/TxnGrouped';
import {AuthStore, FlashStore} from '../store';

function setError(msg: string) {
  FlashStore.flash = msg;
  FlashStore.type = 'error';
}

function App() {
  const [txns, setTxns] = useState<ITxnGrouped.T[]>([]);
  useEffect(() => {
    async function fetchTxns() {
      try {
        const {stale: staleP, fresh: freshP} = cache.withCache(
          'transactions',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return ITxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey)
          }
        );
        const stale = await staleP;
        console.log(stale);
        if (stale) setTxns(stale.data.txns_grouped);
        const fresh = await freshP;
        setTxns(fresh.data.txns_grouped);
      } catch (ex) {
        setError(ex.message);
      }
    }
    fetchTxns();
  }, []);

  return (
    <div className="App">
      {txns.map((txn) =>
        <TxnGrouped
          key={txn.txn_id}
          txn={txn}
          onClick={() => navigate(`/${txn.type === 'fill' ? 'fill' : 'editTxn'}/${txn.txn_id}`)}
        />
      )}
    </div>
  );
}

export default App;
