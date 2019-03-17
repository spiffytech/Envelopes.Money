import gql from 'graphql-tag';
import React, { Component, useEffect, useState } from 'react';

import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function Balances() {
  const [balances, setBalances] = useState<CommonTypes.Balance[]>([]);

  useEffect(() => {
    const apollo = mkApollo(process.env.REACT_APP_HASURA_ADMIN_TOKEN!, true);
    apollo.query<{balances: CommonTypes.Balance[]}>({
      query: gql`
        ${fragments}
        query GetBalances($user_id: String!) {
          balances(where: {user_id: {_eq: $user_id}}) {
            ...balance
          }
        }
      `,
      variables: {user_id: 'TOLLMuRjq'},
    }).then(({data}) => setBalances(data.balances));
  }, []);

  return (
    <table>
      {balances.map((balance) =>
        <tr key={balance.id}>
          <td>{balance.name}</td>
          <td style={{textAlign: 'right'}}>{toDollars(balance.balance)}</td>
        </tr>
      )}
    </table>
  );
}
