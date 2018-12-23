import express from 'express';
import flatten from 'lodash/flatten';
import gql from 'graphql-tag';

import * as CommonTypes from '../../../common/lib/types';
import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export async function getTransactions(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  interface QueryResult extends CommonTypes.ITransaction {
    parts: Array<CommonTypes.ITransactionPart & {
      account: CommonTypes.IBucket;
    }>;
  }

  try {
    const result = await apollo.query<{transactions: QueryResult[]}>({
      query: gql`
        ${fragments}

        query GetTransactions($user_id: String!) {
          transactions(where: {user_id: {_eq: $user_id}}) {
            id
            ...transaction
            parts {
              ...transaction_part
              account {
                ...bucket
              }
            }
          }
        }
      `,
      variables: {user_id: req.userId},
    });

    const parsed: CommonTypes.TxnTuple[] = result.data.transactions.map((transaction) => {
      const parts = transaction.parts;
      const buckets = flatten(parts.map((part) => [part.account]));
      parts.forEach((part) => {
        delete part['account'];
      });
      delete transaction['parts'];

      return {transaction, parts, buckets};
    })

    res.json(parsed);
  } catch (ex) {
    console.error(ex);
    res.statusCode = 500;
    res.json({error: ex.message});
  }
}
