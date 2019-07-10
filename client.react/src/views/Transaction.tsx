import { useLocalStore, useObserver } from "mobx-react-lite";
import React, { useContext } from "react";
import { RouteComponentProps } from "react-router-dom";
import * as shortid from "shortid";

import { toDollars } from "../lib/pennies";
import { formatDate } from "../lib/utils";
import StoreContext, { IAccountBalance, EnvelopeBalance } from "../store";
import {ITransaction, TxnTypes} from '../lib/types'

export default function Transaction({
  match
}: RouteComponentProps<{ txnId: string }>) {
  const txnId = match.params.txnId;
  const store = useContext(StoreContext);
  const localStore = useLocalStore(() => ({
    get txnId() {
      return txnId || shortid.generate();
    },
    hasLoadedTxn: false,
    label: "",
    date: formatDate(new Date()),
    memo: "",
    from_id: "",
      type: "banktxn" as TxnTypes,
    splits: [{ to_id: "", amount: 0 }]
  }));

  function handleSubmit(event: any) {
    event.preventDefault();
    const txns: ITransaction[] = localStore.splits.filter((split) => split.amount !== 0 && split.to_id !== '').map((split) => ({
      id: shortid.generate(),
      memo: localStore.memo,
      date: localStore.date,
      label: localStore.label,
      type: localStore.type,
      txn_id: localStore.txnId,
      from_id: localStore.from_id,
      to_id: split.to_id,
      amount: split.amount,
      user_id: store.creds.userId,
    }));
    
    store.saveTransactions(txns);
  }

  return useObserver(() => {
    if (txnId && !localStore.hasLoadedTxn) {
      const txns = store.transactionsSorted.filter(txn => txn.txn_id === txnId);
      if (!txns[0]) return <p>Loading...</p>;

      localStore.label = txns[0].label || "";
      localStore.date = txns[0].date;
      localStore.memo = txns[0].memo;
      localStore.from_id = txns[0].from_id;
      localStore.type = txns[0].type;
      localStore.splits = txns.map(txn => ({
        to_id: txn.to_id,
        amount: txn.amount
      }));

      localStore.hasLoadedTxn = true;
    }

    const fromChoices: (IAccountBalance | EnvelopeBalance)[] =
      localStore.type === "banktxn"
        ? store.accountBalances
        : localStore.type === "accountTransfer"
        ? store.accountBalances
        : store.envelopeBalances;
    const toChoices: (IAccountBalance | EnvelopeBalance)[] =
      localStore.type === "banktxn"
        ? store.envelopeBalances
        : localStore.type === "accountTransfer"
        ? store.accountBalances
        : store.envelopeBalances;

    return (
      <div className="flex justify-around">
        <form className="content" data-cy="edittxn-form" onSubmit={handleSubmit}>
          <div>
            <label className="label">
              Transaction Type
              <select
                value={localStore.type}
                onChange={event => (localStore.type = event.target.value as TxnTypes)}
                className="input"
              >
                <option value="banktxn">Bank Transaction</option>
                <option value="envelopeTransfer">Envelope Transfer</option>
                <option value="accountTransfer">Account Transfer</option>
              </select>
            </label>
          </div>

          <div>
            <label className="label">
              Who did you pay?
              <input
                value={localStore.label}
                onChange={event => (localStore.label = event.target.value)}
                className="input"
              />
            </label>
          </div>

          {/*
          <div>
            <label className='label'>
              {#if suggestedLabels.length > 0 && (suggestedLabels.length > 1 || suggestedLabels[0] !== txns[0].label)}
                Suggested Payees:
                <div>
                  {#each suggestedLabels as suggestion}
                    <div>
                      <button
                        type='button'
                        className={`input btn btn-tertiary`}
                        on:click|preventDefault={() => setSuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </label>
          </div>
          */}

          <div>
            <label className="label">
              Date
              <input
                type="date"
                value={localStore.date}
                className="input"
                onChange={event => (localStore.date = event.target.value)}
              />
            </label>
          </div>

          <div>
            <label className="label">
              Memo
              <input
                value={localStore.memo}
                onChange={event => (localStore.memo = event.target.value)}
                className="input"
              />
            </label>
          </div>

          <p className="font-bold">
            Sum of splits:{" "}
            {toDollars(
              localStore.splits
                .map(split => split.amount)
                .reduce((acc, item) => acc + item, 0)
            )}
          </p>

          <div>
            <label className="label">
              {localStore.type === "banktxn" ? "Account:" : "Transfer From:"}
              <select
                value={localStore.from_id}
                onChange={event => (localStore.from_id = event.target.value)}
                className="input"
              >
                <option value="">Select a source</option>
                {fromChoices.map(f => (
                  <option value={f.account.id} key={f.account.id}>
                    {f.account.name}:{" "}
                    {toDollars(f.balances[formatDate(new Date())])}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label>
              {localStore.type === "banktxn" ? "Envelopes:" : "Transfer Into:"}
              {localStore.splits.map((split, i) => (
                <>
                  <select
                    value={split.to_id}
                    onChange={event =>
                      (localStore.splits[i].to_id = event.target.value)
                    }
                    className="input"
                  >
                    <option value="">Select a destination</option>
                    {toChoices.map(t => (
                      <option value={t.account.id} key={t.account.id}>
                        {t.account.name}:{" "}
                        {toDollars(t.balances[formatDate(new Date())])}
                      </option>
                    ))}
                  </select>

                  {/*
                <MoneyInput
                  bind:amount={txn.amount}
                  defaultType="debit"
                  on:change={({detail}) => txn.amount = detail}
                />
                */}
                  <div>
                    <input
                      type="number"
                      className="border"
                      value={split.amount / 100}
                      onChange={event =>
                        (localStore.splits[i].amount = Math.round(
                          parseFloat(event.target.value) * 100
                        ))
                      }
                    />
                  </div>
                </>
              ))}
            </label>

            <div className="mb-3 mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => localStore.splits.push({ to_id: "", amount: 0 })}
              >
                New Split
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="submit" className="btn btn-primary">
              Save Transaction
            </button>
            {/*
            <button className="btn btn-tertiary" onClick={deleteTransaction}>
              Delete Transaction
            </button>
          */}
          </div>
        </form>
      </div>
    );
  });
}
