<template>
  <b-form @submit="handleSubmit">
    <b-form-group
      label="Date"
      label-for="date"
    >
      <b-form-input
        id="date"
        type="date"
        required
        v-model="model.date"
      ></b-form-input>
    </b-form-group>

    <b-form-group
      label="Payee"
      label-for="payee"
    >
      <b-form-input
        id="payee"
        required
        v-model="model.payee"
      ></b-form-input>
    </b-form-group>

    <b-form-group
      label="Amount"
      label-for="amount"
    >
      <b-input-group :prepend="isDebit ? '-' : '+'">
        <b-form-input
          id="amount"
          type="number"
          step="0.01"
          required
          v-model="model.amount"
        ></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-form-group
      label="Account"
      label-for="account"
    >
      <b-form-select
        :options="accounts.map((c) => ({value: c._id, text: c.name}))"
        v-model="model.account"
      ></b-form-select>
    </b-form-group>

    <b-form-group
      label="Debit/Credit"
      label-for="debitcredit"
    >
      <b-form-select
        :options="[{value: true, text: 'Expense'}, {value: false, text: 'Credit'}]"
        v-model="isDebit"
      ></b-form-select>
    </b-form-group>

    <b-form-group
      label="Memo"
      label-for="memo"
    >
      <b-form-input
        id="memo"
        v-model="model.memo"
      ></b-form-input>
    </b-form-group>

    <b-form-group
      label="Categories"
    >
      <div
        v-for="([category, amount], i) in model.categories"
        :key="category.name"
      >
        <b-form-select
          :options="categories.map((c) => ({value: c._id, text: c.name}))"
          v-model="model.categories[i][0]"
        ></b-form-select>

          <b-input-group :prepend="isDebit ? '-' : '+'">
          <b-form-input
            v-model="model.categories[i][1]"
            type="number"
            step="0.01"
          ></b-form-input>
        </b-input-group>
      </div>

      <b-btn size="sm" variant="outline-secondary" @click="addCategory">
        <span v-html="octicons['plus'].toSVG()"></span>
      </b-btn>
    </b-form-group>

    <b-button type="submit" variant="primary">Save</b-button>
  </b-form>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import fromPairs from 'lodash/fp/fromPairs';
/* tslint:disable-next-line:no-var-requires */
const octicons = require('octicons');
import { Component, Prop, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

function convertForDebit(isDebit: boolean, amount: Txns.Pennies): Txns.Pennies {
  return isDebit ? amount * -1 as Txns.Pennies : amount;
}

function convertFromDebit(isDebit: boolean, amount: Txns.Pennies): Txns.Pennies {
  return isDebit ? amount * -1 as Txns.Pennies : amount;
}

@Component({})
export default class EditBankTxn extends Vue {
  @Prop({type: Object})
  public txn!: Txns.BankTxn;

  public isDebit = this.txn.amount < 0;

  @Prop({type: Array})
  public accounts!: Txns.Account[];

  @Prop({type: Array})
  public categories!: Txns.Category[];

  @Prop({type: Function})
  public onSubmit!: (txn: Txns.BankTxn) => any;

  public octicons = octicons;

  private model = {
    ...JSON.parse(JSON.stringify(this.txn)),
    type: this.txn.type || 'banktxn',
    date: utils.formatDate(new Date(this.txn.date)),
    memo: this.txn.memo || '',
    payee: this.txn.payee || '',
    account: this.txn.account || this.accounts[0],
  };

  public addCategory() {
    this.model.categories.push([this.categories[0], 0]);
  }

  public mounted() {
    this.model.amount = Txns.penniesToDollars(convertForDebit(this.isDebit, this.txn.amount)).toFixed(2);

    this.model.categories =
      Object.entries(this.txn.categories || {}).
      map(([category, amount]) =>
        [category, Txns.penniesToDollars(convertForDebit(this.isDebit, amount)).toFixed(2)],
      );
  }

  public handleSubmit(event: any) {
    event.preventDefault();
    this.$store.commit('clearFlash');
    if (!this.model.account) {
      return this.$store.commit('setFlash', {msg: 'You must select an acconut', type: 'error'});
    }

    const newTxn: Txns.BankTxn = {
      _id: this.txn._id || Txns.idForBankTxn(new Date(this.model.date), this.model.payee),
      date: new Date(this.model.date).toISOString(),  // Convert to date to get timestamp
      amount: convertFromDebit(this.isDebit, Txns.stringToPennies(this.model.amount)),
      memo: this.model.memo,
      account: this.model.account,
      payee: this.model.payee,
      type: 'banktxn',
      categories: fromPairs(
        this.model.categories.map(([category, amount]: [string, string]) =>
          [category, convertFromDebit(this.isDebit, Txns.stringToPennies(amount))],
        ),
      ),
    };

    console.log(newTxn);
    this.onSubmit(newTxn);
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