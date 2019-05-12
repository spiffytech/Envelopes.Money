import { RouteComponentProps } from '@reach/router';
import React, { useState } from 'react';
import MediaQuery from 'react-responsive';

import Balances from './Balances';
import Transactions from './Transactions';
import * as TxnGrouped from '../lib/TxnGrouped';
import { AuthStore, FlashStore } from '../store';
import { toDollars } from '../lib/pennies';

function triggerDownload(data: string) {
  var a = document.createElement("a");
  document.body.appendChild(a);
  (a as any).style = "display: none";
  const blob = new Blob([data], { type: "octet/stream" });
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
    await TxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey, '')
      .then(({ data }) => data.txns_grouped);

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

export default function Home(props: RouteComponentProps) {
  const [visibleTab, setVisibleTab] = useState<'accounts' | 'transactions'>('accounts');

  function setTab(tab: 'accounts' | 'transactions') {
    return function fn(event: React.FormEvent<any>) {
      event.preventDefault();
      setVisibleTab(tab);
    }
  }

  const headerCss = 'min-w-0 p-3 rounded overflow-auto bg-white border border-2 border-grey-light rounded';

  return (
    FlashStore.type === 'error' ?
      null
      :
      <>
        <MediaQuery query='(max-width: 500px)'>
          <div>
            <div>
              <button
                onClick={setTab('accounts')}
                className='link-btn link-btn-tertiary'
              >
                Accounts/Envelopes
              </button>
              <button
                onClick={setTab('transactions')}
                className='link-btn link-btn-tertiary'
              >
                Transactions
              </button>
            </div>
            {visibleTab === 'accounts' ?
              <div className={`${headerCss} content`}>
                <header className='text-xl font-bold'>Balances</header>
                <Balances />
              </div>
              : visibleTab === 'transactions' ?
                <div className={`${headerCss} content`}>
                  <header className='text-xl font-bold'>Transactions</header>
                  <Transactions />
                </div>
                : null
            }
          </div>
        </MediaQuery>

        <MediaQuery query='(min-width: 501px)'>
          <div className={`${headerCss} sidebar`}>
            <header className='text-xl font-bold'>Balances</header>
            <Balances />
          </div>

          <div className={`${headerCss}`}>
            <button onClick={exportTxns} className='link-btn link-btn-tertiary'>Export Transactions</button>
            <header className='text-xl font-bold'>Transactions</header>
            <Transactions />
          </div>
        </MediaQuery>
      </>
  )
}
