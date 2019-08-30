import gql from 'graphql-tag';

import {fragments} from '../apollo';

export default async function getTransactions(wsclient, userId) {
  const {data: {transactions}} = await wsclient.query({
    query: gql`
      ${fragments}
      query GetTransactions($userId: String!){
        transactions(where: {user_id: {_eq: $userId}}) {
          ...transaction
        }
      }
    `,
    variables: {userId}
  });

  return transactions;
}
