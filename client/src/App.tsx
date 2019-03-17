import gql from 'graphql-tag';
import React, { Component, useEffect, useState } from 'react';

import './App.css';
import Balances from './components/Balances';
import Transactions from './components/Transactions';

import TxnGrouped from './components/TxnGrouped';
import mkClient from './lib/apollo';
import {fragments} from './lib/apollo';
import * as CommonTypes from '../../common/lib/types';

function App() {
  return (
    <div style={{display: 'flex'}}>
      <h1>Balances</h1>
      <Balances />
      <h1>Transactions</h1>
      <Transactions />
    </div>
  )
}

export default App;
