<template>
  <div id="home">
    <AccountBalances id="balances" />
    <Transactions id="transactions" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AccountBalances from '../components/AccountBalances.vue';
import Transactions from '../components/Transactions.vue';

export default Vue.extend({
  name: 'home',
  components: {
    AccountBalances,
    Transactions,
  },
});
</script>

<style>
#home {
  display: flex;
  justify-content: space-evenly;
}

#balances {
  flex-basis: 34%;
}

#transactions {
  flex-basis: 66%;
}
</style>
