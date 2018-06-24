import {inject, observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';
import Balances from './Balances';

export default inject((stores) => ({store: (stores as any).store as typeof Store}))(observer(
  function Home({store}: {store: typeof Store}) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md4">
            <Balances accounts={store.categoryBalances} />
          </div>
          <div className="col-md8">
            <Balances accounts={store.bankBalances} />
          </div>
        </div>
      </div>
    );
  }
));
