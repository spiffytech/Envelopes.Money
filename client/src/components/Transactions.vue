<template>
  <div style="background-color: var(--component-bg); padding: var(--component-padding); border-radius: var(--border-radius-medium); margin: var(--component-margin)">
    <h1>Transactions</h1>
    <table>
      <router-link
        tag="tr"
        class="transaction"
        :to="{
          name: 'EditTransaction',
          query: {
            txnId: txnTuple.transaction.id,
            type: txnTuple.transaction.type === 'fill' ? 'fill' : 'txn',
          }
        }"
        v-for="txnTuple in transactions"
        :key="txnTuple.transaction.id"
      >
        <td style="white-space: nowrap;">{{ txnTuple.transaction.date }}</td>
        <td class="amount">{{ txnTuple.transaction.amount }}</td>
        <td class="ellipsis label">{{ txnTuple.transaction.label }}</td>
        <td class="ellipsis memo">{{ txnTuple.transaction.memo }}</td>
        <td class="ellipsis buckets">{{ Array.from(new Set(txnTuple.buckets.filter(Boolean).map((bucket) => bucket.name))).join(', ') }}</td>
      </router-link>
    </table>
  </div>
</template>

<script lang="ts">
import * as shades from 'shades';
import Vue from 'vue';

import * as CommonTypes from '../../../common/lib/types';
import * as currency from '@/lib/currency';

export default Vue.extend({
  computed: {
    transactions(): CommonTypes.ITransaction[] {
      return shades.mod(shades.all(), 'transaction', 'amount')
        ((amount: number) => currency.toDollars(amount) as any as number)
        (this.$store.getters['transactions/transactions']);
    },
  },
});
</script>

<style scoped>
tr td {
  border-bottom: 2px solid var(--border-color);
  padding: var(--list-item-padding);
}

.transaction {
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label, .memo {
  max-width: 250px;
  text-align: left;
}

.amount {
  text-align: right;
}

.buckets {
  max-width: 250px;
  text-align: left;
}
</style>
