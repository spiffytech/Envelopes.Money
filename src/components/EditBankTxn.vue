<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.dateString" />
      </div>
    </div>

    <div class="field">
      <label class="label">Payee</label>
      <div class="control">
        <input class="input" required v-model="model.payee" />
      </div>
    </div>

    <AccountSelector :accounts="accounts" :model="model.account" />

    <div class="field">
      <label class="label">Memo</label>
      <div class="control">
        <input v-model="model.memo" class="input" />
      </div>
    </div>

    <p>Amount: ${{model.amount.human}}</p>

    <label class="label">Categories</label>
    <CategorySelector
      v-for="(categoryModel, i) in model.categories"
      :key="categoryModel.name + i"
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
import * as Monet from 'monet';
import { Component, Prop, Vue } from 'vue-property-decorator';

import Amount from '@/lib/Amount';
import BankTxn from '@/lib/BankTxn';
import * as Txns from '@/lib/txns';
import AccountSelector from './AccountSelector.vue';
import CategorySelector from './CategorySelector.vue';

@Component({ components: { AccountSelector, CategorySelector } })
export default class EditBankTxn extends Vue {
  @Prop({ type: Object })
  public txn!: Monet.Maybe<Txns.BankTxn>;

  @Prop({ type: Array })
  public accounts!: Txns.Account[];

  @Prop({ type: Array })
  public categories!: Txns.Category[];

  @Prop({ type: Function })
  public onSubmit!: (txn: BankTxn) => any;

  private model =
    this.txn.
    map((txn) => BankTxn.POJO(txn)).
    orSome(BankTxn.Empty());

  public constructor() {
    super();
    this.model.debitMode = true;
  }

  public beforeDestroy() {
    this.$store.commit('clearFlash');
  }

  public addCategory() {
    this.model.addCategory({
      name: this.categories[0].name,
      id: this.categories[0]._id,
      amount: Amount.Pennies(0),
    });
  }

  public findCategoryId(categoryName: string): string {
    const category = this.categories.find((c) => c.name === categoryName);
    if (!category) throw new Error(`No such category: ${name}`);
    return category._id;
  }

  public handleSubmit(_event: any) {
    this.$store.commit('clearFlash');

    this.model.removeZeroCategories();

    const account = this.accounts.find((a) => a.name === this.model.account);
    if (!account) throw new Error('No matching account found');

    this.model.debitMode = false;
    this.onSubmit(this.model);
    this.model.debitMode = true;
  }
}
</script>

<style>
/** Hide spinners on number inputs */

/* For Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

/* Webkit browsers like Safari and Chrome */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>