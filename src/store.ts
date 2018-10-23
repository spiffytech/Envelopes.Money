import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import debounce from 'lodash/debounce';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import { action, autorun, computed, configure as mobxConfigure, observable, runInAction, IObservableValue } from 'mobx';

import Account, {IAccountPOJO, isAccount} from './lib/Account';
import Amount from './lib/Amount';
import {fragments} from './lib/apollo';
import Category, { ICategoryPOJO, isCategory } from './lib/Category';
import Transaction, { ITxnPOJOIn } from './lib/Transaction';
import TransactionGraphQLTranslator from './lib/TransactionGraphQLTranslator';


mobxConfigure({enforceActions: 'always'})

export default class Store {
  @observable public transactions: { [key: string]: Transaction };
  @observable public categories: {[key: string]: Category};
  @observable public accounts: {[key: string]: Account};
  public searchTerm: IObservableValue<string>;

  public constructor(public apollo: ApolloClient<NormalizedCacheObject>) {

    runInAction(() => {
      this.transactions = {};
      this.categories = {};
      this.accounts = {};
      this.searchTerm = observable.box('');
    })

    const loadTxnsDebounced = debounce((term) => this.loadTxns(term), 500);
    Promise.all([
      this.loadCategories(),
      this.loadAccounts(),
    ]).then(() => autorun(() => loadTxnsDebounced(this.searchTerm.get())));
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

  @action
  public setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }

  public async loadTxns(term: string) {
    console.log('Loading txns');

    const result = await this.apollo.query<{ transaction: ITxnPOJOIn[] }>({
      query: gql`
        ${fragments}

        query loadTransactions($searchTerm: String!) {
          transaction(where: {_or: [
            {payee: {_ilike: $searchTerm}}
            {from_account: {name: {_ilike: $searchTerm}}}
            {from_category: {name: {_ilike: $searchTerm}}}
            {to: {account: {name: {_ilike: $searchTerm}}}}
            {to: {category: {name: {_ilike: $searchTerm}}}}
          ]}) {
            ...transaction
          }
        }
      `,
      variables: {
        searchTerm: `%${term}%`,
      }
    });

    const idsAlreadyPosessed = new Set(Object.keys(this.transactions));
    const newIds = new Set(result.data.transaction.map((transaction) => transaction.id));
    newIds.forEach((id) => idsAlreadyPosessed.delete(id));  // Now we have IDs to delete
    runInAction(() => idsAlreadyPosessed.forEach((id) => delete this.transactions[id]));

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
        ${fragments}

        query categories {
          category {
            ...category
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
        ${fragments}

        {
          account {
            ...account
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
