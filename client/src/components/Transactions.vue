<template>
  <div>
    <h1>Transactions</h1>
    <table>
      <router-link
        tag="tr"
        :to="{path: txnTuple.transaction.type === 'fill' ? 'fill' : 'newTransaction', query: {txnId: txnTuple.transaction.id}}"
        v-for="txnTuple in transactions"
        :key="txnTuple.transaction.id"
      >
        <td>{{ txnTuple.transaction.date }}</td>
        <td>{{ txnTuple.transaction.amount }}</td>
        <td>{{ txnTuple.transaction.label }}</td>
        <td>{{ txnTuple.transaction.memo }}</td>
        <td>{{ Array.from(new Set(txnTuple.buckets.filter(Boolean).map((bucket) => bucket.name))).join(', ') }}</td>
      </router-link>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as CommonTypes from '../../../common/lib/types';

export default Vue.extend({
  computed: {
    transactions(): CommonTypes.ITransaction[] {
      return this.$store.getters['transactions/transactions'];
    },
  },
});
</script>
/
