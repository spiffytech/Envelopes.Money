import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import { computed, configure as mobxConfigure, observable, runInAction } from 'mobx';

import Account, {IAccountPOJO, isAccount} from './lib/Account';
import Amount from './lib/Amount';
import Category, { ICategoryPOJO, isCategory } from './lib/Category';
import Transaction, { ITxnPOJOIn } from './lib/Transaction';
import TransactionGraphQLTranslator from './lib/TransactionGraphQLTranslator';

mobxConfigure({enforceActions: 'always'})

export default class Store {
  @observable public transactions: { [key: string]: Transaction };
  @observable public categories: {[key: string]: Category};
  @observable public accounts: {[key: string]: Account};

  public constructor(public apollo: ApolloClient<NormalizedCacheObject>) {

    runInAction(() => {
      this.transactions = {};
      this.categories = {};
      this.accounts = {};
    })
  }

  @computed get transactionsByDate() {
    return Object.values(this.transactions).sort((a, b) => a.date > b.date ? -1 : 1);
  }

  @computed get categoryBalances(): Array<{category: Category, balance: Amount}> {
    const items: Array<{amount: Amount; category: Category}> = [];
    Object.values(this.transactions).
    forEach((transaction) => {
      if (isCategory(transaction.from)) items.push({amount: transaction.amount, category: transaction.from});
      transaction.to.forEach((to) => {
        if (isCategory(to.bucket)) items.push({amount: to.amount, category: to.bucket});
      })
    });

    const sums = mapValues(
      groupBy(items, 'category.id'),
      (group) => group.reduce((sum, item) => Amount.Pennies(sum.pennies + -item.amount.pennies), Amount.Pennies(0))
    );

    return Object.entries(sums).map(([categoryId, sum]) => ({category: this.categories[categoryId], balance: sum}))
  }

  @computed get accountBalances(): Array<{account: Account, balance: Amount}> {
    const items: Array<{amount: Amount; account: Account}> = [];
    Object.values(this.transactions).
    forEach((transaction) => {
      if (isAccount(transaction.from)) items.push({amount: transaction.amount, account: transaction.from});
      transaction.to.forEach((to) => {
        if (isAccount(to.bucket)) items.push({amount: to.amount, account: to.bucket});
      })
    });

    const sums = mapValues(
      groupBy(items, 'account.id'),
      (group) => group.reduce((sum, item) => Amount.Pennies(sum.pennies + item.amount.pennies), Amount.Pennies(0))
    );

    return Object.entries(sums).map(([accountId, sum]) => ({account: this.accounts[accountId], balance: sum}))
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

  public async loadCategories() {
    const result = await this.apollo.query<{ category: ICategoryPOJO[] }>({
      query: gql`
        {
          category {
            name
            id
            target
            interval
            due
            user_id
          }
        }
      `,
    });

    runInAction(() =>
      result.data.category.
      map((pojo) => Category.POJO(pojo)).
      forEach((category) => this.categories[category.id] = category),
    );
  }

  public async loadAccounts() {
    const result = await this.apollo.query<{ account: IAccountPOJO[] }>({
      query: gql`
        {
          account {
            name
            id
            user_id
          }
        }
      `,
    });

    runInAction(() =>
      result.data.account.
      map((pojo) => new Account(pojo)).
      forEach((account) => this.accounts[account.id] = account),
    );
  }
}
