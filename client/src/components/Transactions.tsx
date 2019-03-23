import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import TxnGrouped from './TxnGrouped';
import * as ITxnGrouped from '../lib/TxnGrouped';
import {AuthStore, FlashStore} from '../store';

function setError(msg: string) {
  FlashStore.flash = msg;
  FlashStore.type = 'error';
}

function App() {
  const [txns, setTxns] = useState<ITxnGrouped.T[]>([]);
  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    ITxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey).
    then(({data}) => {
      setTxns(data.txns_grouped);
    }).catch((ex) => setError(ex.message));
  }, []);

  return (
    <div className="App">
      {txns.map((txn) =>
        <TxnGrouped
          key={txn.txn_id}
          txn={txn}
          onClick={() => navigate(`/editTxn/${txn.txn_id}`)}
        />
      )}
    </div>
  );
}

export default App;
