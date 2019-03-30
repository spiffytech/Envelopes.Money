import gql from 'graphql-tag';
import groupBy from 'lodash/groupBy';
import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import styles from './Balances.module.css';
import * as Balances2 from '../lib/Balances';
import * as cache from '../lib/cache';
import {toDollars} from '../lib/pennies';
import { AuthStore, FlashStore } from '../store';

function Balance({balance}: {balance: Balances2.T}) {
    const targetStyle: React.CSSProperties = {
    fontSize: '12px',
  };

  return <>
    <div className={styles.BalanceLabel}>
      <div>{balance.name}</div>
      {Balances2.isBalanceEnvelope(balance) ?
        <progress
          className={balance.balance < 0 ? styles.ProgressFlipped : styles.Progress}
          value={Math.abs(balance.balance)}
          max={balance.extra.target || 0}
        />
        : null
      }
    </div>
    <div>
      <div className={styles.BalanceAmount}>{toDollars(balance.balance)}</div>
      {Balances2.isBalanceEnvelope(balance) ?
        <div className={styles.BalanceTarget} style={{...targetStyle, fontStyle: 'italic'}}>
          {toDollars(balance.extra.target)} / {balance.extra.interval}
        </div> :
        null
      }
    </div>
  </>
}

export default function Balances() {
  const [balances, setBalances] = useState<Balances2.T[]>([]);

  const groups = groupBy(balances, (balance) => balance.type);

  useEffect(() => {
    async function fetchBalances() {
      try {
        const {stale: staleP, fresh: freshP} = cache.withCache(
          'balances',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return Balances2.loadBalancess(AuthStore.userId, AuthStore.apiKey);
          },
        )
        const stale = await staleP;
        if (stale) setBalances(stale.data.balances);
        const fresh = await freshP;
        setBalances(fresh.data.balances);
      } catch (ex) {
        FlashStore.flash = ex.message
        FlashStore.type = 'error';
      }
    }

    fetchBalances();
  }, []);

  const onClick = (balance: Balances2.T) =>
    () =>
      navigate(`/editAccount/${encodeURIComponent(balance.id)}`)

  return (
    <div className={styles.Balances}>
      {groups['account'] ?
        <div>
          <header className={styles.header}>Accounts</header>
          {groups['account'].map((balance) =>
            <div className={styles.Balance} key={balance.id} onClick={onClick(balance)}>
              <Balance balance={balance} />
            </div>
          )}
        </div>
        : null
      }

      {groups['envelope'] ?
        <div>
          <header className={styles.header}>Envelopes</header>
          {groups['envelope'].map((balance) =>
            <div className={styles.Balance} key={balance.id} onClick={onClick(balance)}>
              <Balance balance={balance} />
            </div>
          )}
        </div>
        : null
      }
    </div>
  );
}
