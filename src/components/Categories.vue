<template>
  <table class="table is-fullwidth">
    <tr>
      <td class="list-item">
        <p class="has-text-weight-semibold">Total</p>
        <p class="is-size-4 has-text-weight-semibold">{{formatAmount(totalBalance)}}</p>
      </td>
    </tr>

    <tr
      v-for="category in $store.getters['txns/categories']"
      :key="category.name"
      @click="() => rowClicked(category)"
    >
      <td>
        <div class="list-item">
          <p class="is-size-6 has-text-weight-semibold">{{category.name}}</p>
          <p class="is-size-6 has-text-weight-semibold">{{formatAmount(category.balance.pennies)}}</p>
        </div>

        <div class="list-item">
          <progress
            :class="{progress: true, 'is-small': true, 'is-success': category.balance.pennies >= 0, 'is-danger': category.balance.pennies < 0}"
            :value="Math.abs(category.balance.pennies) || 0"
            :max="category.target.pennies > 0 ? category.target.pennies : Math.abs(category.balance.pennies)"
            style="width: 80%; margin-bottom: 0;"
          />
          <span class="is-size-7">{{formatAmount(category.target.pennies)}}</span>
        </div>
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import add from 'lodash/fp/add';
import fromPairs from 'lodash/fp/fromPairs';
import { Component, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';
import * as StoreTypes from '@/store/types';

@Component({})
export default class Categories extends Vue {
  get categories(): Array<{category: Txns.Category, balance: Txns.Pennies}> {
    // This stuff should get computed in the store: {balance, category}[]
    const balances =
      fromPairs(
        (this.$store.getters['txns/categoryBalances'] as Txns.Balance[]).
        /* tslint:disable-next-line:no-unnecessary-cast */
        map((balance: Txns.Balance) => [balance.name, balance.balance] as [string, Txns.Pennies]),
      );

    const categories = (this.$store.state as StoreTypes.RootState & {txns: StoreTypes.TxnsState}).txns.categories;
    return Object.values(categories).
      sort((a, b) => a.name < b.name ? -1 : 1).
      map((category) => ({category, balance: balances[category.name]}));
  }

  get totalBalance() {
    const balances: Txns.Balance[] = this.$store.getters['txns/categoryBalances'];
    return balances.map(({balance}) => balance as number).reduce(add, 0);
  }

  public formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }

  public progressAmount(balance: Txns.Pennies, target: Txns.Pennies) {
    return Math.abs(Math.max(-100, Math.min(100, balance / target)));
  }

  public rowClicked(category: Txns.Category) {
    this.$router.push({name: 'editCategory', params: {categoryId: category._id}});
  }
}
</script>

<style scoped>
  .list-item {
    display: flex;
    justify-content: space-between;
  }
</style>