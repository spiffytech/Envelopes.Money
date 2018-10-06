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

    <div class="field">
      <label class="label">Account</label>
      <div class="select">
        <div class="control">
          <select :value="model.getFromName" @change="(event) => model.setFromByName(accounts, event.target.value)" required>
            <option
              v-for="account in accounts"
              :key="account.name"
              :value="account.name"
            >
              {{account.name}}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="label">Memo</label>
      <div class="control">
        <input v-model="model.memo" class="input" />
      </div>
    </div>

    <p>Amount: ${{model.amount.human}}</p>

    <label class="label">Categories</label>
    <div
      class="field is-grouped"
      v-for="(modelCategory, i) in model.to"
      :key="'categorySelector-' + i"
    >
      <div class="control">
        <div class="select">
          <select
            :value="modelCategory.bucketName"
            @change="(event) => model.setToByName(categories, event.target.value, i)"
            required
          >
            <option
              v-for="category in categories"
              :key="category.name"
              :value="category.name"
            >
              {{category.name}}
            </option>
          </select>
        </div>
      </div>

      <div class="control">
        <input v-model="model.amount.human" class="input" type="number" step="0.01" />
      </div>
    </div>

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
import { Component, Prop, Vue } from 'vue-property-decorator';

import Amount from '@/lib/Amount';
import BankTxn from '@/lib/BankTxn';
import BucketAmount from '@/lib/BucketAmount';
import Transaction from '@/lib/Transaction';
import { TxnData, TxnPOJO } from '@/lib/Transaction';
import transactionFactory from '@/lib/TransactionFactory';
import {Empty} from '@/lib/TransactionFactory';
import * as Txns from '@/lib/txns';
import AccountSelector from './AccountSelector.vue';

@Component({ components: { AccountSelector } })
export default class EditBankTxn extends Vue {
  @Prop({ type: Object })
  public txn!: BankTxn;

  @Prop({ type: Array })
  public accounts!: Txns.Account[];

  @Prop({ type: Array })
  public categories!: Txns.Category[];

  @Prop({ type: Function })
  public onSubmit!: (txn: Transaction<{payee: string}>) => any;

  private model = this.txn;

  public beforeDestroy() {
    this.$store.commit('clearFlash');
  }

  public updated() {
    this.model = this.txn;
  }

  public addCategory() {
    this.model.addTo(BucketAmount.POJO({
      bucketRef: {
        name: this.categories[0].name,
        id: this.categories[0]._id,
        type: 'category',
      },
      amount: 0,
    }));
  }

  public handleSubmit(_event: any) {
    this.$store.commit('clearFlash');

    this.model.removeZeroTo();

    this.onSubmit(this.model);
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
