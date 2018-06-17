<template>
  <v-data-table
    :items="this.$store.getters.accountBalances"
    :rows-per-page-items="[50]"
  >
    <template slot="items" slot-scope="props">
      <td>{{props.item.account}}</td>
      <td><Amount :amount="props.item.balance"></Amount></td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from 'vue';
import Amount from './Amount.vue';

export default Vue.extend({
  components: {
    Amount,
  }
});
</script>