import groupBy from 'lodash/groupBy';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
        cache.withCache(
          'balances',
          () => {
            if (!AuthStore.loggedIn) throw new Error('User must be logged in');
            return Balances2.loadBalancess(AuthStore.userId, AuthStore.apiKey);
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

  return (
    <div className={styles.Balances}>
      {groups['account'] ?
        <div>
          <header className={styles.header}>Accounts</header>
          {groups['account'].map((balance) =>
            <Link
              to={`/editAccount/${encodeURIComponent(balance.id)}`}
              className={styles.Balance}
              key={balance.id}
            >
              <Balance balance={balance} />
            </Link>
          )}
        </div>
        : null
      }

      {groups['envelope'] ?
        <div>
          <header className={styles.header}>Envelopes</header>
          {groups['envelope'].map((balance) =>
            <Link
              to={`/editAccount/${encodeURIComponent(balance.id)}`}
              className={styles.Balance}
              key={balance.id}
            >
              <Balance balance={balance} />
            </Link>
          )}
        </div>
        : null
      }
    </div>
  );
}
