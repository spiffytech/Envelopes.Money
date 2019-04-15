const fuzzysort = require('fuzzysort');
import {format} from 'date-fns';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import {RouteComponentProps} from 'react-router-dom';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import {AuthStore, FlashStore} from '../store';
import * as cache from '../lib/cache';
import {ITransaction} from '../../../common/lib/types';
import * as Balances from '../lib/Balances';
import MoneyInput from './MoneyInput';
import * as ITransactions from '../lib/ITransactions';
import * as TopLabels from '../lib/TopLabels';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function NewBankTxn(props: RouteComponentProps<{txnId?: string}>) {
  const [type, setType] = useState('banktxn');
  const [balances, setBalances] = useState<Balances.T[]>([]);
  type PartialTransaction = Pick<
    ITransaction,
    'id' | 'user_id' | 'memo' | 'date' | 'amount' | 'label' | 'from_id' | 'to_id'
  >;
  const [txns, setTxns] = useState<PartialTransaction[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      try {
        cache.withCache(
          'balances',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return Balances.loadBalancess(AuthStore.userId, AuthStore.apiKey);
          },
          (data) => setBalances(data.data.balances),
        )
      } catch (ex) {
        FlashStore.flash = ex.message
        FlashStore.type = 'error';
      }
    }

    fetchBalances();
  }, []);

  useEffect(() => {
    if (!props.match.params.txnId) {  // Not loading an existing txs
      return setTxns([]);  // Handle if we click from an existing txn to the New Txn button
    }
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    ITransactions.loadTransaction(AuthStore.userId, AuthStore.apiKey, props.match.params.txnId).
    then(({data}) => {
      if (data.transactions.length === 0) {
        props.history.push('/404');
        return;  // 404
      }

      if (data.transactions[0].type === 'fill') {
        return props.history.push(`/fill/${props.match.params.txnId}`);
      }
      setTxns(data.transactions);
      setType(data.transactions[0].type);
    });
  }, [props.match.params.txnId]);

  const [topLabels, setTopLabels] = useState<{[label: string]: TopLabels.T}>({});

  useEffect(() => {
    async function fetchLabels() {
      cache.withCache(
        'topLabels',
        () => {
          if (!AuthStore.loggedIn) throw new Error('User must be logged in');
          return TopLabels.loadTopLabels(AuthStore.userId, AuthStore.apiKey);
        },
        (data) => setTopLabels(fromPairs(
          data.data.top_labels.map((topLabel) => [topLabel.label, topLabel])
        )),
      );
    }

    fetchLabels();
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
    const txnId = props.match.params.txnId || shortid.generate();
    try {
      const toSubmit =
        txns.map((txn) => ({
          type: type as CommonTypes.TxnTypes,
          txn_id: txnId,
          ...txn,
        })).
        filter((txn) => txn.amount !== 0).
        map((txn) => {
          const {__typename, ...rest} = txn as ITransaction & {__typename: any};
          return rest;
        });

      if (toSubmit.length === 0) {
        FlashStore.flash = 'You must have at least one non-zero split';
        FlashStore.type = 'error';
        return;
      }

      await ITransactions.saveTransactions(AuthStore.userId, AuthStore.apiKey, toSubmit);
      FlashStore.flash = null;
      FlashStore.type = 'default';
      props.history.push('/');
    } catch (ex) {
      FlashStore.flash = ex.message;
      FlashStore.type = 'error';
    }
  }

  async function deleteTransaction(event: React.MouseEvent<any>) {
    event.preventDefault();
    if (!props.match.params.txnId) {
      throw new Error('Shouldn\'t be inside delete handler without a txn to delete');
    }
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    await ITransactions.deleteTransactions(
      AuthStore.userId, AuthStore.apiKey, props.match.params.txnId
    );
    props.history.push('/');
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
    setTxns(txns.map((txn, i) => ({
      ...txn,
      label: suggestion,
      to_id: i === 0 ? topLabels[suggestion].to_id : txn.to_id,
      from_id: i === 0 ? topLabels[suggestion].from_id : txn.from_id,
    })));
  }

  const inputCss = 'w-64 overflow-hidden border';
  const labelCss = 'flex flex-col md:flex-row justify-between';

  return (
    <div className={`flex justify-around content`}>
      <form onSubmit={handleSubmit} className='bg-white p-4 rounded border border-2 border-grey-light m-4'>
        <div>
          <label className={labelCss}>
            <span>Transaction type</span>
            <select
              value={type}
              onChange={(event) => {setTxns([]); setType(event.target.value)}}
              className={inputCss}
            >
              <option value="banktxn">Bank Transaction</option>
              <option value="envelopeTransfer">Envelope Transfer</option>
              <option value="accountTransfer">Account Transfer</option>
            </select>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Who did you pay?
            <input
              value={txns[0].label || ''}
              onChange={(event) => setTxnsProp({label: event.target.value})}
              className={inputCss}
            />
          </label>
        </div>

        <div>
          <label className={labelCss}>
            <span>Suggested payees:</span>
            <div>
              {suggestedLabels.length === 1 && suggestedLabels[0] === txns[0].label ?
                null :
                suggestedLabels.map((suggestion) =>
                <div><button
                  key={suggestion}
                  onClick={(event) => setSuggestion(event, suggestion)}
                  className={`${inputCss} link-btn link-btn-tertiary`}
                >
                  {suggestion}
                </button></div>
                )
              }
            </div>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Date
            <input
              type="date"
              value={format(txns[0].date, 'YYYY-MM-DD')}
              onChange={(event) => setTxnsProp({date: new Date(event.target.value)})}
              className={inputCss}
            />
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Memo
            <input
              value={txns[0].memo}
              onChange={(event) => setTxnsProp({memo: event.target.value})}
              className={inputCss}
            />
          </label>
        </div>

        <p className='font-bold'>
          Total amount: {toDollars(txns.map((txn) => txn.amount || 0).reduce((acc, item) => acc + item, 0))}
        </p>

        <div>
          <label className={labelCss}>
            {type === 'banktxn' ? 'Account:' : 'Transfer from:'}
            <select
              value={txns[0].from_id}
              onChange={(event) => setTxnsProp({from_id: event.target.value})}
              className={inputCss}
            >
              {from.map((f) => <option value={f.id} key={f.id}>{f.name}: {toDollars(f.balance)}</option>)}
            </select>
          </label>
        </div>

        <div>
          <label>
            {type === 'banktxn' ? 'Envelopes:' : 'Transfer into'}
            {txns.map((txn) =>
              <div key={txn.id}>
                <select
                  value={txn.to_id || ''}
                  onChange={(event) => setTxnProp(txn, {to_id: event.target.value})}
                  className={inputCss}
                >
                  {to.map((t) => <option value={t.id} key={t.id}>{t.name}: {toDollars(t.balance)}</option>)}
                </select>

                <MoneyInput
                  default='debit'
                  startingValue={txn.amount}
                  onChange={(num) =>
                    setTxnProp(
                      txn,
                      {amount: num}
                    )
                  }
                />
              </div>
            )}
          </label>

          <button
            onClick={(event) => {event.preventDefault(); addEmptyTxn()}}
            className='link-btn link-btn-secondary'
          >
            New Split
          </button>
        </div>


        <div style={{marginTop: '1rem'}}>
          <button
            type='submit'
            className='link-btn link-btn-primary'
          >
            Save Transaction
          </button>
        </div>

        <div style={{marginTop: '3rem'}}>
          {props.match.params.txnId ? <button onClick={deleteTransaction}>Delete Transaction</button> : null }
        </div>
      </form>
    </div>
  );
}
