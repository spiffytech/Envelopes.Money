<template>
  <div>
    <h1>Transactions</h1>
    <table>
      <tr v-for="txnTuple in transactions" :key="txnTuple.transaction.id">
        <td>{{ txnTuple.transaction.date }}</td>
        <td>{{ txnTuple.transaction.amount }}</td>
        <td>{{ txnTuple.transaction.label }}</td>
        <td>{{ txnTuple.transaction.memo }}</td>
        <td>{{ Array.from(new Set(txnTuple.buckets.filter(Boolean).map((bucket) => bucket.name))).join(', ') }}</td>
      </tr>
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
