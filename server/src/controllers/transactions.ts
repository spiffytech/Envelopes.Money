import express from 'express';
import flatten from 'lodash/flatten';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import gql from 'graphql-tag';
import uniq from 'lodash/uniq';

import * as CommonTypes from '../../../common/lib/types';
import mkApollo from '../lib/apollo';
import {fragments} from '../lib/apollo';

export async function getTransactions(req: express.Request, res: express.Response) {
  const apollo = await mkApollo(req.apikey!);

  interface QueryResult {
    transactions: CommonTypes.ITransaction[];
    transaction_parts: CommonTypes.ITransactionPart[];
    buckets: CommonTypes.IBucket[];
  }

  try {
    const result = await apollo.query<QueryResult>({
      query: gql`
        ${fragments}

        query GetTransactions2($user_id: String!) {
          transactions(where: {user_id: {_eq: $user_id}}) {
            ...transaction
          }
          transaction_parts(where: {user_id: {_eq: $user_id}}) {
            ...transaction_part
          }
          buckets(where: {user_id: {_eq: $user_id}}) {
            ...bucket
          }
        }
      `,
      variables: {user_id: req.userId},
    });

    const partsGrouped = groupBy(result.data.transaction_parts, 'transaction_id');
    const bucketsById = fromPairs(result.data.buckets.map((bucket) => [bucket.id, bucket]));

    const parsed: CommonTypes.TxnBucketTuple[] = result.data.transactions.map((transaction) => ({
      transaction,
      parts: partsGrouped[transaction.id],
      buckets: uniq(partsGrouped[transaction.id].map((part) => bucketsById[part.account_id || 'null'])),
    }));

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
