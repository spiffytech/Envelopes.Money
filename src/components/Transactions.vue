<template>
  <v-data-table
    :headers="headers"
    :items="this.$store.state.txns"
    :rows-per-page-items="[50]"
    :disable-initial-sort="true"
  >
    <template slot="items" slot-scope="props">
      <td><FirebaseDate :date="props.item.date"></FirebaseDate></td>

      <td class="text-xs-left">{{ props.item.payee }}</td>

      <td class="text-xs-right">
        <Amount :amount="props.item.amount"></Amount>
      </td>

      <td class="text-xs-left">
        <CategoriesSpan :categories="props.item.categories" v-if="props.item.items.map((item) => item.account)"></CategoriesSpan>
      </td>

      <td class="text-xs-left">{{ props.item.account }}</td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Amount from './Amount.vue';
  import CategoriesSpan from './CategoriesSpan.vue';
  import FirebaseDate from './FirebaseDate.vue';
  import Transaction from './Transaction.vue';

  export default Vue.extend({
    components: {
      Amount,
      CategoriesSpan,
      FirebaseDate,
      Transaction,
    },
    data() {
      return {
        headers: [
          {text: 'Date', value: 'date'},
          {text: 'Payee', value: 'payee'},
          {text: 'Amount', value: 'amount'},
          {text: 'Categories', value: 'categories'},
          {text: 'Account', value: 'account'},
        ]
      };
    },
  });
</script>