import express from 'express';
import gql from 'graphql-tag';

import * as CommonTypes from '../../../common/lib/types';
import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export async function getBalances(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  type QueryResult = CommonTypes.IBucket  & {
    sum: number;
  }

  try {
    const result = await apollo.query<{account_balances: QueryResult[]}>({
      query: gql`
        ${fragments}
        query GetBalances($user_id: String!) {
          account_balances(where: {user_id: {_eq: $user_id}}) {
            ...account_balance
          }
        }
      `,
      variables: {user_id: req.userId},
    });

    const ret = result.data.account_balances.map((balance) => {
      const amount = balance.sum;
      delete balance['sum'];
      return {bucket: balance, balance: amount};
    });

    res.json(ret);
  } catch (ex) {
    console.error(ex);
    res.statusCode = 500;
    res.json({error: ex.message});
  }
}
