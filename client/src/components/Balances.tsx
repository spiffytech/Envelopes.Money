import gql from 'graphql-tag';
import groupBy from 'lodash/groupBy';
import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import * as CommonTypes from '../../../common/lib/types';
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
      <div style={{textAlign: 'right'}}>{toDollars(balance.balance)}</div>
      {Balances2.isBalanceEnvelope(balance) ?
        <div style={{textAlign: 'right', ...targetStyle, fontStyle: 'italic'}}>
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

  const trStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    border: '1px solid black',
    borderRadius: '5px',
    marginBottom: '4px',
  };

  const onClick = (balance: Balances2.T) =>
    () =>
      navigate(`/editAccount/${encodeURIComponent(balance.id)}`)

  return (
    <div>
      {groups['account'] ?
        <>
          <h2>Accounts</h2>
          {groups['account'].map((balance) =>
            <div style={trStyle} onClick={onClick(balance)}>
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
            <div style={trStyle} onClick={onClick(balance)}>
              <Balance balance={balance} />
            </div>
          )}
        </>
        : null
      }
    </div>
  );
}
