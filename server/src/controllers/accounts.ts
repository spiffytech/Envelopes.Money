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

export async function saveEnvelope(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);
  console.log(req.body);

  try {
    await apollo.mutate({
      mutation: gql`
        mutation UpsertEnvelope($objects: [buckets_insert_input!]!) {
          insert_buckets(
            objects: $objects,
            on_conflict: {
              constraint: buckets_pkey,
              update_columns: [name, extra]
            }
          ) {
            returning {
              id
            }
          }
        }
      `,
      variables: {objects: [{
        id: req.body.id,
        user_id: req.body.user_id,
        name: req.body.name,
        extra: req.body.extra,
      }]}
    });

    res.json({});
  } catch (ex) {
    console.error(ex.message);
    res.statusCode = 500;
    res.json({error: ex.message});
  }
}
