import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import Loading from './Loading';
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
  const [loading, setLoading] = useState<string | null>(null);
  useEffect(() => {
    async function fetchTxns() {
      try {
        setLoading('Loading from cache');
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
        setLoading('Loading from server');
        const fresh = await freshP;
        setTxns(fresh.data.txns_grouped);
        setLoading(null);
      } catch (ex) {
        setLoading(null);
        setError(ex.message);
      }
    }
    fetchTxns();
  }, []);

  return (
    <div className="App">
      <Loading loading={loading} />
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
