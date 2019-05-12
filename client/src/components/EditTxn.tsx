import { format } from 'date-fns';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import { Observer, useLocalStore } from "mobx-react-lite"
import { RouteComponentProps } from 'react-router-dom';
import React, { useEffect } from 'react';
import * as shortid from 'shortid';

import { AuthStore, FlashStore } from '../store';
import * as cache from '../lib/cache';
import { ITransaction } from '../../../common/lib/types';
import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import SplitList from './SplitList';
import * as TopLabels from '../lib/TopLabels';
import * as CommonTypes from '../../../common/lib/types';
import { toDollars } from '../lib/pennies';

const fuzzysort = require('fuzzysort');

export default function NewBankTxn(props: RouteComponentProps<{ txnId?: string }>) {
  const finalTxnId = props.match.params.txnId || shortid.generate();
  const store = useLocalStore(() => ({
    loading: 0,
    type: 'banktxn' as CommonTypes.TxnTypes,
    txns: [] as (ITransactions.EmptyTransaction | ITransactions.T)[],
    balances: [] as Balances.T[],
    topLabels: {} as { [label: string]: TopLabels.T },
    get label() {
      return this.txns[0].label || '';
    },
    get date() {
      return this.txns[0].date;
    },
    get memo() {
      return this.txns[0].memo;
    },
    get from_id() {
      return this.txns[0].from_id;
    },
    get suggestedLabels(): string[] {
      return fuzzysort.go(this.label, Object.values(this.topLabels).map((l) => l.label))
        .map((result: { target: string }) => result.target)
        .slice(0, 5);
    },
    get derivedTxns(): (ITransactions.EmptyTransaction | ITransactions.T)[] {
      return this.txns.map((txn) => ({
        ...txn,
        date: this.date,
        memo: this.memo,
        from_id: this.from_id,
        type: this.type,
        txn_id: finalTxnId,
      }));
    },
    get accounts() {
      if (this.balances.length === 0) return {envelope: [], account: []}
      return groupBy(this.balances, 'type');
    },
    get from() {
      return this.type === 'banktxn' ? this.accounts['account'] :
        this.type === 'accountTransfer' ? this.accounts['account'] :
          this.accounts['envelope'];
    },
    get to() {
      return this.type === 'banktxn' ? this.accounts['envelope'] :
        this.type === 'accountTransfer' ? this.accounts['account'] :
          this.accounts['envelope'];
    },
  }));

  useEffect(() => {
    async function fetchBalances() {
      try {
        store.loading += 1;
        cache.withCache(
          'balances',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return Balances.loadBalances(AuthStore.userId, AuthStore.apiKey);
          },
          (data) => store.balances = data.data.balances,
        );
        store.loading -= 1;
      } catch (ex) {
        store.loading -= 1;
        FlashStore.flash = ex.message
        FlashStore.type = 'error';
      }
    }

    fetchBalances();
  }, [store.balances, store.loading]);

  useEffect(() => {
    if (!props.match.params.txnId) {  // Not loading an existing txs
      return;  // Handle if we click from an existing txn to the New Txn button
    }
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    store.loading += 1;
    ITransactions.loadTransaction(AuthStore.userId, AuthStore.apiKey, props.match.params.txnId)
      .then(({ data }) => {
        if (data.transactions.length === 0) {
          props.history.push('/404');
          return;  // 404
        }

        if (data.transactions[0].type === 'fill') {
          return props.history.push(`/fill/${props.match.params.txnId}`);
        }
        store.txns = data.transactions;
        store.type = data.transactions[0].type;
        store.loading -= 1;
      });
  }, [props.history, props.match.params.txnId, store.loading, store.txns, store.type]);

  useEffect(() => {
    async function fetchLabels() {
      store.loading += 1;
      cache.withCache(
        'topLabels',
        () => {
          if (!AuthStore.loggedIn) throw new Error('User must be logged in');
          return TopLabels.loadTopLabels(AuthStore.userId, AuthStore.apiKey);
        },
        (data) => store.topLabels = fromPairs(
          data.data.top_labels.map((topLabel) => [topLabel.label, topLabel])
        ),
      );
      store.loading -= 1;
    }

    fetchLabels();
  }, [store.loading, store.topLabels])

  // if (store.balances.length === 0) return <p>Loading...</p>;

  //if (store.from.length === 0 || store.to.length === 0) {
  //  return <p>Go create some accounts and envelopes before trying to do this</p>;
  //}

  function addEmptyTxn() {
    if (!AuthStore.loggedIn) throw new Error('Must be logged in');
    store.txns = [
      ...store.txns,
      {
        id: shortid.generate(),
        user_id: AuthStore.userId,
        memo: '',
        date: new Date(),
        amount: 0,
        label: null,
        from_id: null,
        to_id: null,
      }
    ];
  }
  if (store.txns.length === 0) {
    addEmptyTxn();
    // return <p>Loading...</p>
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    try {
      const toSubmit =
        store.derivedTxns
          .filter((txn) => txn.amount !== 0)
          .map((txn) => {
            const { __typename, ...rest } = txn as ITransaction & { __typename: any };
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
    store.txns = store.txns.map((t) => {
      return { ...t, ...props };
    });
  }

  function setSuggestion(event: React.FormEvent, suggestion: string) {
    event.preventDefault();
    store.txns = store.txns.map((txn, i) => ({
      ...txn,
      label: suggestion,
      to_id: i === 0 ? store.topLabels[suggestion].to_id : txn.to_id,
      from_id: i === 0 ? store.topLabels[suggestion].from_id : txn.from_id,
    }));
  }

  const inputCss = 'w-64 overflow-hidden border';
  const labelCss = 'flex flex-col md:flex-row justify-between';

  return (
    <Observer>{() =>
    store.loading > 0 ? <p>Loading...</p> :
    <div className={`flex justify-around content`}>
      <form onSubmit={handleSubmit} className='bg-white p-4 rounded border border-2 border-grey-light m-4'>
        <div>
          <label className={labelCss}>
            <span>Transaction type</span>
            <Observer>{() =>
            <select
              value={store.type}
              onChange={(event) => {
                store.txns = [];
                store.type = event.target.value as CommonTypes.TxnTypes;
              }}
              className={inputCss}
            >
              <option value="banktxn">Bank Transaction</option>
              <option value="envelopeTransfer">Envelope Transfer</option>
              <option value="accountTransfer">Account Transfer</option>
            </select>
            }</Observer>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Who did you pay?
            <Observer>{() =>
            <input
              value={store.label}
              onChange={(event) => store.txns[0].label = event.target.value }
              className={inputCss}
            />
            }</Observer>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            <span>Suggested payees:</span>
            <Observer>{() =>
            <div>
              {store.suggestedLabels.length === 1 && store.suggestedLabels[0] === store.label ?
                null :
                store.suggestedLabels.map((suggestion) =>
                  <div key={suggestion}><button
                    key={suggestion}
                    onClick={(event) => setSuggestion(event, suggestion)}
                    className={`${inputCss} link-btn link-btn-tertiary`}
                  >
                    {suggestion}
                  </button></div>
                )
              }
            </div>
            }</Observer>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Date
            <Observer>{() =>
            <input
              type="date"
              value={format(store.date, 'YYYY-MM-DD')}
              onChange={(event) => setTxnsProp({ date: new Date(event.target.value) })}
              className={inputCss}
            />
            }</Observer>
          </label>
        </div>

        <div>
          <label className={labelCss}>
            Memo
            <Observer>{() =>
            <input
              value={store.memo}
              onChange={(event) => store.txns[0].memo = event.target.value }
              className={inputCss}
            />
            }</Observer>
          </label>
        </div>

        <Observer>{() =>
        <p className='font-bold'>
          Total amount: {toDollars(store.txns.map((txn) => txn.amount || 0).reduce((acc, item) => acc + item, 0))}
        </p>
        }</Observer>

        <div>
          <Observer>{() =>
          <label className={labelCss}>
            {store.type === 'banktxn' ? 'Account:' : 'Transfer from:'}
            <select
              value={store.from_id || ''}
              onChange={(event) => store.txns[0].from_id = event.target.value}
              className={inputCss}
            >
              {store.from.map((f) => <option value={f.id} key={f.id}>{f.name}: {toDollars(f.balance)}</option>)}
            </select>
          </label>
          }</Observer>
        </div>

        <div>
          <Observer>{() =>
          <label>
            {store.type === 'banktxn' ? 'Envelopes:' : 'Transfer into'}
            <SplitList txns={store.txns} to={store.to} />
          </label>
          }</Observer>

          <button
            onClick={(event) => { event.preventDefault(); addEmptyTxn() }}
            className='link-btn link-btn-secondary'
          >
            New Split
          </button>
        </div>


        <div style={{ marginTop: '1rem' }}>
          <button
            type='submit'
            className='link-btn link-btn-primary'
          >
            Save Transaction
          </button>
        </div>

        <div style={{ marginTop: '3rem' }}>
          {props.match.params.txnId ? <button onClick={deleteTransaction}>Delete Transaction</button> : null}
        </div>
      </form>
    </div>
    }</Observer>
  );
}
