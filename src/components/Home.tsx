import {inject, observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';
import Balances from './Balances';
import TxnList from './TxnList';

export default inject((stores) => ({store: (stores as any).store as typeof Store}))(observer(
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
            <TxnList />
          </div>
        </div>
      </div>
    );
  }
));
