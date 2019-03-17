import gql from 'graphql-tag';
import React, { Component, useEffect, useState } from 'react';

import './App.css';
import TxnGrouped from './components/TxnGrouped';
import mkClient from './lib/apollo';
import {fragments} from './lib/apollo';
import * as CommonTypes from '../../common/lib/types';

function App() {
  const [txns, setTxns] = useState<CommonTypes.TxnGrouped[]>([]);
  useEffect(() => {
    const apollo = mkClient(process.env.REACT_APP_HASURA_ADMIN_TOKEN!, true);
    apollo.query<{txns_grouped: CommonTypes.TxnGrouped[]}>({
      query: gql`
        ${fragments}
        query GetTxnsGrouped($user_id: String!) {
          txns_grouped(where: {user_id: {_eq: $user_id}}) {
            ...txn_grouped
          }
        }
      `,
      variables: {user_id: 'TOLLMuRjq'},
    }).then(({data}) => {
      setTxns(data.txns_grouped);
    });
  }, []);

  return (
    <div className="App">
      <table>
        <tbody>
          {txns.map((txn) =>
            <TxnGrouped key={txn.txn_id} txn={txn} />
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
