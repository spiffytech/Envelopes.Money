<template>
  <div class="ui celled relaxed list">
    <div class="item">
      <div class="list-item">
        <p class="header">Total</p>
        <p>{{formatAmount(totalBalance)}}</p>
      </div>
    </div>

    <div class="item" v-for="category in categories" :key="category.category.name">
      <div class="list-item">
        <p class="header">{{category.category.name}}</p>
        <p class="header">{{formatAmount(category.balance)}}</p>
      </div>

      <div class="list-item">
        <div
          :class="{ui: true, progress: true, success: category.balance >= 0, error: category.balance < 0}"
          :data-percent="progressAmount(category.balance, category.category.target) * .75"
          style="margin-bottom: 0; width: 80%; height: 0.6rem;"
          :id="'progress-' + category.category.name"
          ref="progress"
        >
          <div class="bar" :style="{width: progressAmount(category.balance, category.category.target) + '%', height: '0.6rem'}"></div>
        </div>

        <small>{{formatAmount(category.category.target)}}</small>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import jQuery from 'jquery';
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

  public activateProgressBars(els: any[]) {
    this.$nextTick(() => els.forEach((el) => (jQuery(el) as any).progress(30)));
  }
}
</script>

<style scoped>
  .list-item {
    display: flex;
    justify-content: space-between;
  }
</style>