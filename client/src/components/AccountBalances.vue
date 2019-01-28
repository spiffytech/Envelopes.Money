<template>
  <div style="background-color: var(--component-bg); padding: var(--component-padding); border-radius: var(--border-radius-medium); margin: var(--component-margin)">
    <h1>Balances</h1>

    <h2>Accounts</h2>
    <div v-for="balance in accountBalances" :key="balance.bucket.id" class="account-balance">
      <div class="account-name">{{balance.bucket.name}}</div>
      <div>💵{{balance.balance}}</div>
    </div>

    <h2>Envelopes</h2>
    <div v-for="balance in envelopeBalances" :key="balance.bucket.id">
      <Envelope :balance="balance" />
    </div>
  </div>
</template>

<script lang="ts">
import * as shades from 'shades';
import Vue from 'vue';

import {toDollars} from '@/lib/currency';
import * as CommonTypes from '../../../common/lib/types';
import * as AccountBalance from '../../../common/lib/AccountBalance';
import Envelope from './Envelope.vue';

export default Vue.extend({
  components: {Envelope},

  computed: {
    accountBalances(): CommonTypes.AccountBalance[] {

      return shades.mod(shades.all(), 'balance')
        ((amount: number) =>
          (amount / 100).
          toLocaleString([], {minimumFractionDigits: 2, maximumFractionDigits: 2}) as any as number
        )
        (this.$store.getters['accounts/accountBalances']);
    },
    envelopeBalances(): CommonTypes.AccountBalance[] {
      return this.$store.getters['accounts/envelopeBalances'];
    },
  },
});
</script>

<style scoped>
.account-balance {
  background-color: var(--list-item-background-color);
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--list-item-margin-bottom);
  padding: var(--list-item-padding);
  border-bottom: 2px solid var(--border-color);
}

.account-name {
  font-size: 20px;
}
</style>
