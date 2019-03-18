import {navigate, RouteComponentProps} from '@reach/router';
import React, {useEffect, useState} from 'react';
import * as shortid from 'shortid';

import {AuthStore} from '../store';
import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import {toDollars} from '../lib/pennies';

export default function FillEnvelopes(props: RouteComponentProps) {
  const [balances, setBalances] = useState<Balances.T[]>([]);
  interface Fill {envelopeId: string; amount: number;}
  const [fills, setFills] = useState<Fill[]>([]);

  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    Balances.loadTransaction(AuthStore.userId, AuthStore.apiKey).
    then(({data}) => {
      setBalances(data.balances);
      setFills(data.balances.map((balance) => ({envelopeId: balance.id, amount: 0})));
    });
  }, []);

  const envelopes = balances.filter((balance) => balance.type === 'envelope');
  const unallocated = envelopes.find((envelope) => envelope.name === '[Unallocated]');

  if (envelopes.length === 0 || fills.length === 0) return <p>Loading...</p>;

  if (!unallocated) throw new Error('You don\'t have an [Unallocated] category!');

  function setFillAmount(fill: Fill, amount: number) {
    setFills(fills.map((f) => {
      if (fill !== f) return f;
      return {...f, amount}
    }));
  }

  async function handleSubmit(event: React.FormEvent<any>) {
    event.preventDefault();
    const txnId = shortid.generate();
    if (!AuthStore.userId) throw new Error('User must be logged in');
    const txns: ITransactions.T[] = envelopes.map((envelope, i) => {
      if (!AuthStore.userId) throw new Error('User must be logged in');
      const fill = fills[i];
      const txn: ITransactions.T = {
        id: shortid.generate(),
        user_id: AuthStore.userId,
        memo: '',
        date: new Date(),
        amount: fill.amount,
        label: null,
        type: 'fill',
        txn_id: txnId,
        from_id: unallocated!.id,
        to_id: envelope.id,
      };
      return txn;
    }).filter((txn) => txn.amount !== 0);

    console.log(txns);

    await ITransactions.deleteTransactions(AuthStore.userId, AuthStore.apiKey, txnId);
    await ITransactions.saveTransactions(AuthStore.userId, AuthStore.apiKey, txns);
    navigate('/');
  }

  return (
    <>
      <p>Unallocated: {toDollars(unallocated.balance)}</p>
      <form onSubmit={handleSubmit}>
        <table>
          <tbody>
            {envelopes.map((envelope, i) =>
              <tr key={envelope.id}>
                <td>{envelope.name}</td>
                <td>{toDollars(envelope.balance)}</td>
                <td>
                  <input
                    type='number'
                    step='0.01'
                    value={fills[i].amount / 100}
                    onChange={(event) => setFillAmount(fills[i], parseFloat(event.target.value) * 100 || 0)}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <input type='submit' value='Fill!' />
      </form>
    </>
  )
}
