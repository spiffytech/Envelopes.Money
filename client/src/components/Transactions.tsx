import debounce from 'lodash/debounce';
import React, { useEffect, useState, useRef } from 'react';
import { Redirect } from 'react-router';

import Loading from './Loading';
import TxnGrouped from './TxnGrouped';
import * as cache from '../lib/cache';
import * as ITxnGrouped from '../lib/TxnGrouped';
import {AuthStore, FlashStore} from '../store';

function setError(msg: string) {
  FlashStore.flash = msg;
  FlashStore.type = 'error';
}


export default function Transactions() {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [txns, setTxns] = useState<ITxnGrouped.T[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const itemModulo = 100;
  const [maxItems, setMaxItems] = useState(itemModulo);
  const [searchTerm, setSearchTerm] = useState('');

  const componentRef = useRef<any | null>(null);

  useEffect(() => {
    if (!componentRef.current) return;
    componentRef.current.addEventListener('scroll', () => {
      console.log(componentRef.current.scrollTop + componentRef.current.clientHeight >= componentRef.current.scrollHeight - 1);
      console.log('ref', componentRef.current.scrollTop, componentRef.current.clientHeight, componentRef.current.scrollHeight);
    })
  }, [componentRef]);

  const {current: fetchTxns} = useRef(debounce((value: string) => {
    console.log('Searching')
    async function fetchTxns() {
      try {
        setLoading('Loading from cache');
        cache.withCache(
          'transactions',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return ITxnGrouped.loadTransactions(AuthStore.userId, AuthStore.apiKey, value)
          },
          (data, isFresh) => {
            setLoading(isFresh ? null : 'Loading from server');
            setTxns(data.data.txns_grouped);
          }
        );
      } catch (ex) {
        setLoading(null);
        setError(ex.message);
      }
    }
    fetchTxns();
  }, 1000, {leading: false}));

  useEffect(() => fetchTxns(searchTerm), [searchTerm]);

  if (redirect) return <Redirect to={redirect} />

  return (
    <div ref={componentRef} style={{height: 'calc(100% - 150px)', display: 'flex', flexDirection: 'column'}}>
      <Loading loading={loading} />
      <input value={searchTerm} onChange={(event) => {event.preventDefault(); setSearchTerm(event.target.value)}} />
      {txns.slice(0, maxItems).map((txn) =>
        <TxnGrouped
          key={txn.txn_id}
          txn={txn}
          onClick={() => setRedirect(`/${txn.type === 'fill' ? 'fill' : 'editTxn'}/${txn.txn_id}`)}
        />
      )}
      {new Array(Math.ceil(txns.length / itemModulo)).fill(null).map((n, i) =>
        <button key={i} onClick={(event) => {event.preventDefault(); setMaxItems(itemModulo * i)}}>{i+1}</button>
      )}
    </div>
  );
}
