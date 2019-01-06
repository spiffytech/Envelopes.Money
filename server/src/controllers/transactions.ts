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

    const parsed: CommonTypes.TxnBucketTuple[] = result.data.transactions.map((transaction) => {
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

export async function upsertTransaction(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  const {transaction, parts} = req.body;
  console.log(req.body);

  try {
    await apollo.mutate({
      mutation: gql`
        mutation UpsertTransaction(
          $transaction_id: String!,
          $user_id: String!,
          $transactions: [transactions_insert_input!]!,
          $parts: [transaction_parts_insert_input!]!
        ) {
          delete_transaction_parts(where: {_and: [
            {transaction_id: {_eq: $transaction_id}},
            {user_id: {_eq: $user_id}},
          ]}) {
            returning {
              id
            }
          }

          insert_transactions(
            objects: $transactions,
            on_conflict: {
              constraint: transactions_pkey,
              update_columns: [memo, date, amount, label]
            }
          ) {returning {id}}

          insert_transaction_parts(objects: $parts) {returning {id}}
        }
      `,
      variables: {
        transaction_id: transaction.id, user_id: req.userId,
        transactions: [transaction],
        parts,
      },
    });
    console.log("done")

    res.json({});

  } catch (ex) {
    console.error(ex);
    res.statusCode = 500;
    res.json({error: ex.message});
  }
}

export async function deleteTransaction(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  const {transaction} = req.body;
  console.log(req.body);

  try {
    await apollo.mutate({
      mutation: gql`
        mutation DeleteTransaction(
          $transaction_id: String!,
          $user_id: String!,
        ) {
          delete_transaction_parts(where: {_and: [
            {transaction_id: {_eq: $transaction_id}},
            {user_id: {_eq: $user_id}},
          ]}) {
            returning {
              id
            }
          }

          delete_transactions(
            where: {_and: [
              {id: {_eq: $transaction_id}},
              {user_id: {_eq: $user_id}}
            ]}
          ) {returning {id}}
        }
    `,
    variables: {
      transaction_id: transaction.id,
      user_id: req.userId,
    },
  });
  console.log("done")
  res.json({});

  } catch (ex) {
    console.error(ex);
    res.statusCode = 500;
    res.json({error: ex.message});
  }
}
