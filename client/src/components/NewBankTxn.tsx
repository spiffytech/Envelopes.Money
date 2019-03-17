import {format} from 'date-fns';
import groupBy from 'lodash/groupBy';
import {navigate, RouteComponentProps} from '@reach/router';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import {AuthStore} from '../store';
import {ITransaction} from '../../../common/lib/types';
import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function NewBankTxn(props: RouteComponentProps & {txnId?: string}) {
  const [type, setType] = useState('banktxn');
  const [balances, setBalances] = useState<CommonTypes.Balance[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [txns, setTxns] = useState<Partial<ITransaction>[]>([]);

  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    Balances.loadTransaction(AuthStore.userId, AuthStore.apiKey).
    then(({data}) => setBalances(data.balances));
  }, []);

  useEffect(() => {
    if (!props.txnId) return;  // Not loading an existing txs
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    ITransactions.loadTransaction(AuthStore.userId, AuthStore.apiKey, props.txnId).
    then(({data}) => {
      if (data.transactions.length === 0) {
        navigate('/404');
        return;  // 404
      }
      setTxns(data.transactions);
    });
  }, [props.txnId]);

  if (balances.length === 0) return <p>Loading...</p>;

  const accounts = groupBy(balances, 'type');
  const from =
    type === 'banktxn' ? accounts['account'] :
    type === 'accountTransfer' ? accounts['account'] :
    accounts['envelope'];
  const to =
    type === 'banktxn' ? accounts['envelope'] :
    type === 'accountTransfer' ? accounts['account'] :
    accounts['envelope'];

  if (from.length === 0 || to.length === 0) {
    return <p>Go create some accounts and envelopes before trying to do this</p>;
  }
  if (selectedFrom === null) setSelectedFrom(from[0].id);

  function addEmptyTxn() {
    if (!AuthStore.loggedIn) throw new Error('Must be logged in');
    setTxns([
      ...txns,
      {
        id: shortid.generate(),
        user_id: AuthStore.userId,
        memo: '',
        date: new Date(),
        amount: 0,
        label: null,
      }
    ]);
  }
  if (txns.length === 0) {
    addEmptyTxn();
  }

  function setDates(date: string) {
    setTxns(txns.map((txn) => ({...txn, date: new Date(date)})));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function setTxnProp(txn: Partial<CommonTypes.ITransaction>, props: Partial<CommonTypes.ITransaction>) {
    setTxns((txns.map((t) => {
      if (t !== txn) return t;
      return {...t, ...props};
    })))
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <p>Total amount: {toDollars(txns.map((txn) => txn.amount || 0).reduce((acc, item) => acc + item, 0))}</p>

        <input
          type="date"
          value={format(txns[0] ? txns[0].date! : new Date(), 'YYYY-MM-DD')}
          onChange={(event) => setDates(event.target.value)}
        />

        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="banktxn">Bank Transaction</option>
          <option value="envelopeTransfer">Envelope Transfer</option>
          <option value="accountTransfer">Account Transfer</option>
        </select>

        <select value={selectedFrom || ''} onChange={(event) => setSelectedFrom(event.target.value)}>
          {from.map((f) => <option value={f.id} key={f.id}>{f.name} - {toDollars(f.balance)}</option>)}
        </select>


        {txns.map((txn) =>
          <div key={txn.id}>
            <p>{JSON.stringify(txn)}</p>
            <select
              value={txn.to_id || ''}
              onChange={(event) => setTxnProp(txn, {to_id: event.target.value})}
            >
              {to.map((t) => <option value={t.id} key={t.id}>{t.name} - {toDollars(t.balance)}</option>)}
            </select>

            <input
              type="number"
              step="0.01"
              value={(txn.amount || 0) / 100 || 0}
              onChange={(event) => setTxnProp(txn, {amount: Math.round(parseFloat(event.target.value) * 100)})}
            />
          </div>
        )}

        <button onClick={() => addEmptyTxn()}>New Split</button>

        <button type='submit'>Save Transaction</button>
      </form>
    </>
  );
}
