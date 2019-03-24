const fuzzysort = require('fuzzysort');
import {format} from 'date-fns';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import {navigate, RouteComponentProps} from '@reach/router';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import {AuthStore} from '../store';
import {ITransaction} from '../../../common/lib/types';
import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import * as TopLabels from '../lib/TopLabels';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function NewBankTxn(props: RouteComponentProps & {txnId?: string}) {
  const [type, setType] = useState('banktxn');
  const [balances, setBalances] = useState<Balances.T[]>([]);
  type PartialTransaction = Pick<
    ITransaction,
    'id' | 'user_id' | 'memo' | 'date' | 'amount' | 'label' | 'from_id' | 'to_id'
  >;
  const [txns, setTxns] = useState<PartialTransaction[]>([]);

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

      if (data.transactions[0].type === 'fill') {
        return navigate(`/fill/${props.txnId}`);
      }
      setTxns(data.transactions);
      setType(data.transactions[0].type);
    });
  }, [props.txnId]);

  const [topLabels, setTopLabels] = useState<{[label: string]: TopLabels.T}>({});

  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    TopLabels.loadTopLabels(AuthStore.userId, AuthStore.apiKey).
    then(({data}) => {
      setTopLabels(fromPairs(
        data.top_labels.map((topLabel) => [topLabel.label, topLabel])
      ));
    })
  }, [])

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
        from_id: from[0].id,
        to_id: to[0].id,
      }
    ]);
  }
  if (txns.length === 0) {
    addEmptyTxn();
    return <p>Loading...</p>
  }

  const suggestedLabels: string[] =
    fuzzysort.go(txns[0].label || '', Object.values(topLabels).map((l) => l.label)).
    map((result: {target: string}) => result.target).
    slice(0, 5);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    const txnId = props.txnId || shortid.generate();
    await ITransactions.saveTransactions(
      AuthStore.userId, AuthStore.apiKey,
      txns.map((txn) => ({
        type: type as CommonTypes.TxnTypes,
        txn_id: txnId,
        ...txn,
      })).map((txn) => {
        const {__typename, ...rest} = txn as ITransaction & {__typename: any};
        return rest;
      }),
    );
    navigate('/');
  }

  async function deleteTransaction(event: React.MouseEvent<any>) {
    event.preventDefault();
    if (!props.txnId) {
      throw new Error('Shouldn\'t be inside delete handler without a txn to delete');
    }
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    await ITransactions.deleteTransactions(
      AuthStore.userId, AuthStore.apiKey, props.txnId
    );
    navigate('/');
  }

  function setTxnsProp(props: Partial<CommonTypes.ITransaction>) {
    setTxns((txns.map((t) => {
      return {...t, ...props};
    })))
  }

  function setTxnProp(txn: Partial<CommonTypes.ITransaction>, props: Partial<CommonTypes.ITransaction>) {
    setTxns((txns.map((t) => {
      if (t !== txn) return t;
      return {...t, ...props};
    })))
  }

  function setSuggestion(event: React.FormEvent, suggestion: string) {
    event.preventDefault();
    setTxnsProp({label: suggestion});
    setTxns(txns.map((txn, i) => ({
      ...txn,
      to_id: i === 0 ? topLabels[suggestion].to_id : txn.to_id,
    })));
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Date
            <input
              type="date"
              value={format(txns[0].date, 'YYYY-MM-DD')}
              onChange={(event) => setTxnsProp({date: new Date(event.target.value)})}
            />
          </label>
        </div>

        <div>
          <label >
            Transaction type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="banktxn">Bank Transaction</option>
              <option value="envelopeTransfer">Envelope Transfer</option>
              <option value="accountTransfer">Account Transfer</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Who did you pay?
            <input value={txns[0].label || ''} onChange={(event) => setTxnsProp({label: event.target.value})} />
          </label>
        </div>

        <div>
          <label>
            Suggested payees:
            {suggestedLabels.map((suggestion) =>
              <button key={suggestion} onClick={(event) => setSuggestion(event, suggestion)}>{suggestion}</button>
            )}
          </label>
        </div>

        <div>
          <label>
            This was paid from:
            <select value={txns[0].from_id} onChange={(event) => setTxnsProp({from_id: event.target.value})}>
              {from.map((f) => <option value={f.id} key={f.id}>{f.name} - {toDollars(f.balance)}</option>)}
            </select>
          </label>
        </div>

        <div>
          <p>Total amount: {toDollars(txns.map((txn) => txn.amount || 0).reduce((acc, item) => acc + item, 0))}</p>
          <label>
            You paid into these accounts/envelopes:
            {txns.map((txn) =>
              <div key={txn.id}>
                <select
                  value={txn.to_id || ''}
                  onChange={(event) => setTxnProp(txn, {to_id: event.target.value})}
                >
                  {to.map((t) => <option value={t.id} key={t.id}>{t.name} - {toDollars(t.balance)}</option>)}
                </select>

                <input
                  type="number"
                  
                  value={Number((txn.amount || 0) / 100 || 0).toString()}
                  onChange={(event) => setTxnProp(txn, {amount: Math.round(parseFloat(event.target.value) * 100)})}
                />
              </div>
            )}
          </label>

          <button onClick={(event) => {event.preventDefault(); addEmptyTxn()}}>New Split</button>
        </div>


        <div style={{marginTop: '1rem'}}>
          <button type='submit'>Save Transaction</button>
        </div>

        <div style={{marginTop: '3rem'}}>
          {props.txnId ? <button onClick={deleteTransaction}>Delete Transaction</button> : null }
        </div>
      </form>
    </>
  );
}
