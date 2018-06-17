<template>
  <v-list two-line>
    <Transaction v-for="txn of this.$store.state.txns" :txn="txn" :key="txn.id"></Transaction>
  </v-list>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Transaction from './Transaction.vue';

  export default Vue.extend({
    components: {
      Transaction,
    }
  });
</script>