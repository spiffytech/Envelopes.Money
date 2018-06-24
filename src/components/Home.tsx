import {inject, observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';
import Balances from './Balances';

export default inject((stores) => ({store: (stores as any).store as typeof Store}))(observer(
  function Home({store}: {store: typeof Store}) {
    return (
      <div>
        <Balances accounts={store.bankBalances} />
        <Balances accounts={store.categoryBalances} />
      </div>
    );
  }
));
