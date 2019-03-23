import gql from 'graphql-tag';
import groupBy from 'lodash/groupBy';
import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import styles from './Balances.module.css';
import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import * as Balances2 from '../lib/Balances';
import {toDollars} from '../lib/pennies';
import { AuthStore, FlashStore } from '../store';

function Balance({balance}: {balance: Balances2.T}) {
    const targetStyle: React.CSSProperties = {
    fontSize: '12px',
  };

  return <>
    <span style={{fontWeight: 'bold'}}>{balance.name}</span>
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
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    const apollo = mkApollo(AuthStore.apiKey);
    apollo.query<{balances: Balances2.T[]}>({
      query: gql`
        ${fragments}
        query GetBalances($user_id: String!) {
          balances(where: {user_id: {_eq: $user_id}}) {
            ...balance
          }
        }
      `,
      variables: {user_id: AuthStore.userId},
    }).then(({data}) => setBalances(data.balances)).
    catch((ex) => {
      FlashStore.flash = ex.message
      FlashStore.type = 'error';
    });
  }, []);

  const onClick = (balance: Balances2.T) =>
    () =>
      navigate(`/editAccount/${encodeURIComponent(balance.id)}`)

  return (
    <div>
      {groups['account'] ?
        <>
          <h2>Accounts</h2>
          {groups['account'].map((balance) =>
            <div className={styles.Balance} onClick={onClick(balance)}>
              <Balance balance={balance} />
            </div>
          )}
        </>
        : null
      }

      {groups['envelope'] ?
        <>
          <h2>Envelopes</h2>
          {groups['envelope'].map((balance) =>
            <div className={styles.Balance} onClick={onClick(balance)}>
              <Balance balance={balance} />
            </div>
          )}
        </>
        : null
      }
    </div>
  );
}
