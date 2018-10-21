import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import { computed, configure as mobxConfigure, observable, runInAction } from 'mobx';

import Transaction, { ITxnPOJOIn } from './lib/Transaction';
import TransactionGraphQLTranslator from './lib/TransactionGraphQLTranslator';

mobxConfigure({enforceActions: 'always'})

export default class Store {
  @observable public transactions: { [key: string]: Transaction };

  public constructor(public apollo: ApolloClient<NormalizedCacheObject>) {

    runInAction(() => {
      this.transactions = {};
    })
  }

  @computed get transactionsByDate() {
    return Object.values(this.transactions).sort((a, b) => a.date > b.date ? -1 : 1);
  }

  public async loadTxns() {
    const result = await this.apollo.query<{ transaction: ITxnPOJOIn[] }>({
      query: gql`
        {
          transaction {
            id
            date
            amount
            memo
            type
            payee
            from_account {
              id
              name
            }
            from_category {
              id
              name
              target
              interval
              due
            }
            to {
              amount
              category {
                id
                name
                target
                interval
                due
              }
              account {
                id
                name
              }
            }
          }
        }
      `,
    });

    runInAction(() =>
      result.data.transaction.
      map((pojo) => TransactionGraphQLTranslator.fromGraphQL(pojo)).
      forEach((txn) => this.transactions[txn.id] = txn),
      // TODO: Remove deleted Txns from this
    );
  }
}
