import gql from 'graphql-tag';
import {navigate} from '@reach/router';
import React, { useEffect, useState } from 'react';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';
import { AuthStore } from '../store';

export default function Balances() {
  const [balances, setBalances] = useState<CommonTypes.Balance[]>([]);

  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    const apollo = mkApollo(AuthStore.apiKey);
    apollo.query<{balances: CommonTypes.Balance[]}>({
      query: gql`
        ${fragments}
        query GetBalances($user_id: String!) {
          balances(where: {user_id: {_eq: $user_id}}) {
            ...balance
          }
        }
      `,
      variables: {user_id: AuthStore.userId},
    }).then(({data}) => setBalances(data.balances));
  }, []);

  return (
    <table>
      <tbody>
        {balances.map((balance) =>
          <tr
            key={balance.id}
            onClick={() =>
              navigate(`/editAccount/${encodeURIComponent(balance.id)}`)
            }
          >
            <td>{balance.name}</td>
            <td style={{textAlign: 'right'}}>{toDollars(balance.balance)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
