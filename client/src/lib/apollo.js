import gql from 'graphql-tag';

const httpUri = window._env_.GRAPHQL_HTTP_HOST;
const wssUri = window._env_.GRAPHQL_WSS_HOST;
if (!httpUri) throw new Error('Missing HTTP GraphQL endpoint');
if (!wssUri) throw new Error('Missing WSS GraphQL endpoint');

export const fragments = gql`
      fragment transaction on transactions {
        id
        user_id
        memo
        date
        amount
        label
        txn_id
        from_id
        to_id
        type
        insertion_order
        cleared
      }
      
      fragment account on accounts {
        id
        user_id
        name
        type
        extra
        tags
      }

      fragment balance on balances {
        id
        user_id
        name
        type
        extra
        balance
        tags
      }

      fragment txn_grouped on txns_grouped {
        to_names
        to_ids
        amount
        txn_id
        user_id
        label
        date
        memo
        type
        from_id
        from_name
      }

      fragment tag on tags {
        user_id
        tag
      }
    `;
