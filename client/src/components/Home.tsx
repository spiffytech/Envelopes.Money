import {observer} from 'mobx-react-lite';
import {RouteComponentProps} from '@reach/router';
import React from 'react';

import '../App.css';
import Balances from './Balances';
import Transactions from './Transactions';
import {FlashStore} from '../store';

export default observer(function Home(props: RouteComponentProps) {
  return (
    FlashStore.type === 'error' ?
      null
      :
      <div style={{display: 'flex'}}>
        <h1>Balances</h1>
        <Balances />
        <h1>Transactions</h1>
        <Transactions />
      </div>
  )
});
