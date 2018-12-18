import express from 'express';
import gql from 'graphql-tag';

import * as CommonTypes from '../../../common/lib/types';
import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export async function getTransactions(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  interface QueryResult extends CommonTypes.ITransaction {
    parts: Array<CommonTypes.ITransactionPart & {
      from: CommonTypes.IBucket;
      to: CommonTypes.IBucket;
    }>;
  }

  const result = await apollo.query<{transactions: QueryResult[]}>({
    query: gql`
      ${fragments}

      query GetTransactions($user_id: String!) {
        transactions(where: {user_id: {_eq: $user_id}}) {
          id
          ...transaction
          parts {
            ...transaction_part
            from {
              ...bucket
            }
            to {
              ...bucket
            }
          }
        }
      }
    `,
    variables: {user_id: req.userId},
  })

  res.json(result);
}
