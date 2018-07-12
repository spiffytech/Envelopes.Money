<template>
  <b-list-group>
    <b-list-group-item v-for="account in accounts" :key="account.account.name">
      <div class="d-flex w-100 justify-content-between">
        <h6>{{account.account.name}}</h6>
        <small>{{formatAmount(account.balance)}}</small>
      </div>
    </b-list-group-item>
  </b-list-group>

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';
import * as StoreTypes from '@/store/types';

@Component({})
export default class Categories extends Vue {
  get accounts(): Array<{account: Txns.Account, balance: Txns.Pennies}> {
    const balances: Txns.Balance[] = this.$store.getters['txns/accountBalances'];
    return balances.map((balance) => ({
      account: {name: balance.name},
      balance: balance.balance,
    }));
  }

  private formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }
}
</script>