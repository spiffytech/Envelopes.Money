<template>
  <b-list-group>
    <b-list-group-item v-for="category in categories" :key="category.category.name">
      <div class="d-flex w-100 justify-content-between">
        <h5>{{category.category.name}}</h5>
        <small>{{formatAmount(category.balance)}}</small>
      </div>

      <div class="d-flex w-100 justify-content-between">
        <b-progress
          :value="progressAmount(category.balance, category.category.target)"
          :variant="category.balance < 1 ? 'danger' : 'success'"
          class="w-75"
        ></b-progress>
        <small>{{formatAmount(category.category.target)}}</small>
      </div>
    </b-list-group-item>
  </b-list-group>
</template>

<script lang="ts">
import * as R from 'ramda';
import { Component, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';
import * as StoreTypes from '@/store/types';

@Component({})
export default class Categories extends Vue {
  get categories(): Array<{category: Txns.Category, balance: Txns.Pennies}> {
    // This stuff should get computed in the store: {balance, category}[]
    const balances =
      R.fromPairs(
        (this.$store.getters['txns/categoryBalances'] as Txns.Balance[]).
        map((balance: Txns.Balance) => [balance.name, balance.balance] as [string, Txns.Pennies]),
      );

    const categories = (this.$store.state as StoreTypes.RootState & {txns: StoreTypes.TxnsState}).txns.categories;
    return Object.values(categories).
      sort((a, b) => a.name < b.name ? -1 : 1).
      map((category) => ({category, balance: balances[category.name]}));
  }

  private formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }

  private progressAmount(balance: Txns.Pennies, target: Txns.Pennies) {
    return Math.abs(Math.max(-100, Math.min(100, balance / target)));
  }
}
</script>