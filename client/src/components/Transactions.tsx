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
  const itemModulo = 100;
  const [maxItems, setMaxItems] = useState(itemModulo);
  useEffect(() => {
    async function fetchTxns() {
      try {
        setLoading('Loading from cache');
        cache.withCache(
          'transactions',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return ITxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey)
          },
          (data, isFresh) => {
            setLoading(isFresh ? null : 'Loading from server');
            setTxns(data.data.txns_grouped);
          }
        );
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
      {txns.slice(0, maxItems).map((txn) =>
        <TxnGrouped
          key={txn.txn_id}
          txn={txn}
          onClick={() => navigate(`/${txn.type === 'fill' ? 'fill' : 'editTxn'}/${txn.txn_id}`)}
        />
      )}
      {new Array(Math.ceil(txns.length / itemModulo)).fill(null).map((n, i) =>
        <button onClick={(event) => {event.preventDefault(); setMaxItems(itemModulo * i)}}>{i}</button>
      )}
    </div>
  );
}

export default App;
