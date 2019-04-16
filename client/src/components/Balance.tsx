import React, { useEffect, useState } from 'react';

import * as Balances from '../lib/Balances';
import styles from './Balance.module.css';
import { toDollars } from '../lib/pennies';

export default function Balance({ balance, adjustment }: { balance: Balances.T, adjustment?: number }) {
  const prorated = Balances.isBalanceEnvelope(balance) ? Balances.calcAmountForPeriod(balance)['monthly'] : 0;
  adjustment = adjustment || 0;

  return <>
    <div className='font-bold'>
      <div>{balance.name}</div>
      {Balances.isBalanceEnvelope(balance) ?
        <progress
          className={balance.balance < 0 ? styles.ProgressFlipped : styles.Progress}
          value={Math.abs(balance.balance) + adjustment}
          max={balance.extra.target || 0}
        />
        : null
      }
    </div>
    <div>
      <div className='text-right'>{toDollars(balance.balance + adjustment)}</div>
      {Balances.isBalanceEnvelope(balance) ?
        <div className='text-right text-xs italic'>
          {toDollars(prorated)} / month
        </div> :
        null
      }
    </div>
  </>
}
