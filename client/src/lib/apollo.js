import gql from 'graphql-tag';

export const fragments = gql`
      fragment transaction on transactions {
        id
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
        _fingerprint
        coordinates
      }
      
      fragment account on accounts {
        id
        name
        type
        extra
        tags
        _fingerprint
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
