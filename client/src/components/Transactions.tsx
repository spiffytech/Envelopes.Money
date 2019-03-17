import gql from 'graphql-tag';
import {Link} from '@reach/router';
import React, { useEffect, useState } from 'react';

import TxnGrouped from './TxnGrouped';
import mkClient from '../lib/apollo';
import {fragments} from '../lib/apollo';
import * as CommonTypes from '../../../common/lib/types';
import {AuthStore} from '../store';

function App() {
  const [txns, setTxns] = useState<CommonTypes.TxnGrouped[]>([]);
  useEffect(() => {
    if (!AuthStore.loggedIn) throw new Error('User must be logged in');
    const apollo = mkClient(AuthStore.apiKey);
    apollo.query<{txns_grouped: CommonTypes.TxnGrouped[]}>({
      query: gql`
        ${fragments}
        query GetTxnsGrouped($user_id: String!) {
          txns_grouped(where: {user_id: {_eq: $user_id}}) {
            ...txn_grouped
          }
        }
      `,
      variables: {user_id: AuthStore.userId},
    }).then(({data}) => {
      setTxns(data.txns_grouped);
    });
  }, []);

  return (
    <div className="App">
      <table>
        <tbody>
          {txns.map((txn) =>
            <Link to={`/editTxn/${txn.txn_id}`}>
              <TxnGrouped key={txn.txn_id} txn={txn} />
            </Link>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
