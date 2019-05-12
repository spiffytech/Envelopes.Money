import React from 'react';
import {Observer} from 'mobx-react-lite';

import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import MoneyInput from './MoneyInput';
import { toDollars } from '../lib/pennies';

export default function Split(
  {txn, to}:
  {
    txn: ITransactions.EmptyTransaction | ITransactions.T,
    to: Balances.T[],
  }
) {
  const inputCss = 'w-64 overflow-hidden border';
  return (
    <div>
      <Observer>{() =>
      <select
        value={txn.to_id || ''}
        onChange={(event) => txn.to_id = event.target.value}
        className={inputCss}
      >
        {to.map((t) => <option value={t.id} key={t.id}>{t.name}: {toDollars(t.balance)}</option>)}
      </select>
      }</Observer>

      <Observer>{() =>
      <MoneyInput
        default='debit'
        startingValue={txn.amount}
        onChange={(num) => txn.amount = num}
      />
      }</Observer>
    </div>
 );
}
