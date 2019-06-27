<template>
  <div>
    <div
      v-for="txn in transactions"
      :key="txn.id"
      class="flex justify-between p-3 rounded m-1 shadow-md bg-white"
    >
      <div class="mr-2">{{ txn.date }}</div>
      <div class="text-left flex-1 min-w-0 mr-2">
        <div class="text-left font-bold">
          <span v-if="txn.label">{{ txn.label }}</span>
          <span v-else class="italic text-sm">No Label</span>
        </div>

        <div class="flex flex-1 text-xs italic">
          <span class="whitespace-no-wrap">{{
            accounts[txn.from_id].name
          }}</span>
          &nbsp;→&nbsp;
          <span
            style="text-overflow: ellipsis"
            class="whitespace-no-wrap overflow-hidden"
            >{{ accounts[txn.to_id].name }}</span
          >
        </div>
      </div>

      <div class="text-right">{{ toDollars(txn.amount) }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { ITransaction } from '../lib/types';
import { toDollars } from '../lib/pennies';

export default Vue.extend({
  data() {
    return {
      toDollars
    };
  },
  computed: {
    accountId() {
      return this.$route.params.accountId;
    },

    accounts() {
      return this.$store.state.accounts;
    },

    transactions() {
      return (this.$store.getters.transactions as ITransaction[]).filter(
        txn => txn.from_id === this.accountId || txn.to_id === this.accountId
      );
    }
  }
});
</script>
