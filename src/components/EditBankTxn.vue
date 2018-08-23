<template>
  <form @submit="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.date" />
      </div>
    </div>

    <div class="field">
      <label class="label">Payee</label>
      <div class="control">
        <input class="input" required v-model="model.payee" />
      </div>
    </div>

    <label class="label">Amount</label>
    <div class="field has-addons">
      <div class="control">
        <input :class="{input: true, 'is-danger': !doesAmountEqualCategories(this.model)}" type="number" step="0.01" required v-model="model.amount" />
      </div>
      <div class="control">
        <div class="select">
          <select v-model="isDebit">
            <option :value="true">Expense</option>
            <option :value="false">Credit</option>
          </select>
        </div>
      </div>
    </div>
    <p class="help is-danger" v-if="!doesAmountEqualCategories(this.model)">Amount is different from the total of category amounts</p>

    <AccountSelector :accounts="accounts" :model="model" />

    <div class="field">
      <label class="label">Memo</label>
      <div class="control">
        <input v-model="model.memo" class="input" />
      </div>
    </div>

    <label class="label">Categories</label>
    <CategorySelector
      v-for="(categoryModel, i) in model.categories"
      :key="categoryModel[0] + i"
      :categories="categories"
      :model="model.categories[i]"
    />

    <div class="field">
      <div class="control">
        <button class="button" type="button" @click="addCategory">Add Category</button>
      </div>
    </div>

    <button class="button" type="submit">Save</button>
  </form>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import fromPairs from 'lodash/fp/fromPairs';
/* tslint:disable-next-line:no-var-requires */
import { Component, Prop, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';
import AccountSelector from './AccountSelector.vue';
import CategorySelector from './CategorySelector.vue';

function convertForDebit(isDebit: boolean, amount: Txns.Pennies): Txns.Pennies {
  return isDebit ? amount * -1 as Txns.Pennies : amount;
}

function convertFromDebit(isDebit: boolean, amount: Txns.Pennies): Txns.Pennies {
  return isDebit ? amount * -1 as Txns.Pennies : amount;
}

interface Model {
  _id: string | null;
  account: string;
  payee: string;
  type: 'banktxn';
  date: string;
  memo: string;
  amount: string;
  categories: Array<[string, string]>;
}

@Component({components: {AccountSelector, CategorySelector}})
export default class EditBankTxn extends Vue {
  @Prop({type: Object})
  public txn?: Txns.BankTxn;

  public isDebit = this.txn ? this.txn.amount < 0 : true;

  @Prop({type: Array})
  public accounts!: Txns.Account[];

  @Prop({type: Array})
  public categories!: Txns.Category[];

  @Prop({type: Function})
  public onSubmit!: (txn: Txns.BankTxn) => any;

  private model: Model =
    this.txn ? {
    _id: this.txn._id,
    type: this.txn.type,
    date: utils.formatDate(this.txn.date),
    amount: Txns.penniesToDollars(convertForDebit(this.isDebit, this.txn.amount)).toFixed(2),
    memo: this.txn.memo,
    payee: this.txn.payee,
    account: this.txn.account,
    categories: this.txn.categories.map(({name, amount}) =>
      [name, Txns.penniesToDollars(convertForDebit(this.isDebit, amount)).toFixed(2)] as [string, string],
    ),
  } : {
    _id: null,
    type: 'banktxn',
    date: utils.formatDate(new Date().toJSON()),
    amount: '0.00',
    memo: '',
    payee: '',
    account: this.accounts[0].name,
    categories: [] as Array<[string, string]>,
  };

  public addCategory() {
    this.model.categories.push([this.categories[0].name, '0']);
  }

  public findCategoryId(categoryName: string): string {
    const category = this.categories.find((c) => c.name === categoryName);
    if (!category) throw new Error(`No such category: ${name}`);
    return category._id;
  }

  public handleSubmit(event: any) {
    event.preventDefault();
    this.$store.commit('clearFlash');
    if (!this.model.account) {
      return this.$store.commit('setFlash', {msg: 'You must select an acconut', type: 'error'});
    }

    this.removeZeroCategories();

    const account = this.accounts.find((a) => a.name === this.model.account);
    if (!account) throw new Error('No matching account found');

    if (!this.doesAmountEqualCategories(this.model)) {
      throw new Error('Transaction amount does not equal category amounts');
    }

    const newTxn: Txns.BankTxn = {
      _id: this.model._id || Txns.idForBankTxn(new Date(this.model.date), this.model.payee),
      date: new Date(this.model.date).toJSON(),  // Convert to date to get timestamp
      amount: convertFromDebit(this.isDebit, Txns.stringToPennies(this.model.amount)),
      memo: this.model.memo,
      account: this.model.account,
      accountId: account._id,
      payee: this.model.payee,
      type: 'banktxn',
      categories:
        this.model.categories.map(([name, amount]: [string, string]) =>
          ({
            name,
            id: this.findCategoryId(name),
            amount: convertFromDebit(this.isDebit, Txns.stringToPennies(amount)),
          }),
        ),
    };

    this.onSubmit(newTxn);
  }

  private removeZeroCategories() {
    this.model.categories = this.model.categories.filter(([_, amount]) => Txns.stringToPennies(amount) !== 0);
  }

  private doesAmountEqualCategories(model: Model) {
    const amountPennies = Txns.stringToPennies(model.amount);
    const categoriesPennies = model.categories.map(([_, amount]) => Txns.stringToPennies(amount));
    return amountPennies === categoriesPennies.reduce((acc, item) => acc + item, 0);
  }
}
</script>

<style>
/** Hide spinners on number inputs */

/* For Firefox */
input[type='number'] {
    -moz-appearance:textfield;
}

/* Webkit browsers like Safari and Chrome */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>