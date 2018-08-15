<template>
  <div class="ui celled list">
    <div class="item">
      <div class="list-item">
        <p class="has-text-weight-semibold">Total</p>
        <p class="is-size-4">{{formatAmount(totalBalance)}}</p>
      </div>
    </div>

    <div class="item" v-for="account in accounts" :key="account.name">
      <div class="list-item">
        <p class="is-size-6 has-text-weight-semibold">{{account.name}}</p>
        <p>{{formatAmount(account.balance)}}</p>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import add from 'lodash/fp/add';
import { Component, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

@Component({})
export default class Accounts extends Vue {
  get accounts(): Array<{name: string, balance: Txns.Pennies}> {
    const balances: Txns.Balance[] = this.$store.getters['txns/accountBalances'];
    return balances.map((balance) => ({
      name: balance.name,
      balance: balance.balance,
    }));
  }

  get totalBalance() {
    const balances: Txns.Balance[] = this.$store.getters['txns/accountBalances'];
    return balances.map(({balance}) => balance as number).reduce(add, 0);
  }

  public formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }
}
</script>

<style scoped>
  .list-item {
    display: flex;
    justify-content: space-between;
  }
</style>