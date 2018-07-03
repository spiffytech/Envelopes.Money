import {observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';
import Balances from './Balances';
import TxnList from './TxnList';

export default observer(
  function Home({store}: {store: typeof Store}) {
    return (
      <div className="container-fluid">
        <div className="row flex-nowrap">
          <div className="col-md4">
            <Balances accounts={store.categoryBalances} />
          </div>

          <div className="col-md4">
            <Balances accounts={store.bankBalances} />
          </div>

          <div className="col-md4">
            <TxnList store={store} />
          </div>
        </div>
      </div>
    );
  }
);
