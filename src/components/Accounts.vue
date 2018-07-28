<template>
  <b-list-group>
    <b-list-group-item>
      <div class="d-flex w-100 justify-content-between">
        <h5>Total</h5>
        <span>{{formatAmount(totalBalance)}}</span>
      </div>
    </b-list-group-item>

    <b-list-group-item v-for="account in accounts" :key="account.name">
      <div class="d-flex w-100 justify-content-between">
        <h6>{{account.name}}</h6>
        <small>{{formatAmount(account.balance)}}</small>
      </div>
    </b-list-group-item>
  </b-list-group>

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