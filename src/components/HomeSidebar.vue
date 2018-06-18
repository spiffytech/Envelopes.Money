<template>
  <v-tabs>
    <v-tab>Categories</v-tab>
    <v-tab>Accounts</v-tab>
    <v-tab-item>
      <Categories></Categories>
    </v-tab-item>

    <v-tab-item>
      <AccountBalances></AccountBalances>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from 'vue';
import AccountBalances from './AccountBalances.vue';
import Categories from './Categories.vue';
export default Vue.extend({
  components: {
    AccountBalances,
    Categories,
  }
});
</script>