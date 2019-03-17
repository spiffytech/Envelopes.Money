import {RouteComponentProps} from '@reach/router';
import React, { Component, useEffect, useState } from 'react';

import '../App.css';
import Balances from './Balances';
import Transactions from './Transactions';

export default function Home(props: RouteComponentProps) {
  return (
    <div style={{display: 'flex'}}>
      <h1>Balances</h1>
      <Balances />
      <h1>Transactions</h1>
      <Transactions />
    </div>
  )
}
