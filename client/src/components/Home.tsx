import {observer} from 'mobx-react-lite';
import {RouteComponentProps} from '@reach/router';
import React from 'react';

import styles from './Home.module.css';
import Balances from './Balances';
import Transactions from './Transactions';
import * as TxnGrouped from '../lib/TxnGrouped';
import {AuthStore, FlashStore} from '../store';
import { toDollars } from '../lib/pennies';

function triggerDownload(data: string) {
  var a = document.createElement("a");
  document.body.appendChild(a);
  (a as any).style = "display: none";
  const blob = new Blob([data], {type: "octet/stream"});
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = 'export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

async function exportTxns(event: React.FormEvent<any>) {
  event.preventDefault();
  if (!AuthStore.loggedIn) throw new Error('User must be logged in');
  const txnsGrouped =
    await TxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey).
      then(({data}) => data.txns_grouped);

  const dataStr =
    JSON.stringify(txnsGrouped.map((t) => ({
      date: t.date,
      amount: toDollars(t.amount),
      from: t.from_name,
      to: t.to_names,
      memo: t.memo,
      type: t.type,
      label: t.label
    })));

  triggerDownload(dataStr);
}

export default observer(function Home(props: RouteComponentProps) {
  return (
    FlashStore.type === 'error' ?
      null
      :
      <>
        <button onClick={exportTxns} className={styles.ExportTxns}>Export Transactions</button>
        <div style={{display: 'flex'}}>
          <div className={styles.Balances}>
            <header className={styles.header}>Balances</header>
            <Balances />
          </div>

          <div className={styles.Transactions}>
            <header className={styles.header}>Transactions</header>
            <Transactions />
          </div>
        </div>
      </>
  )
});
