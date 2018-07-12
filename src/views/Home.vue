<template>
  <b-container fluid>
    <b-row>
      <b-col cols="4">
        <b-tabs>
          <b-tab title="Categories" active>
            <Categories></Categories>
          </b-tab>

          <b-tab title="Accounts">
            <Accounts></Accounts>
          </b-tab>
        </b-tabs>
      </b-col>

      <b-col cols="8">
        <Transactions :txns="txns"></Transactions>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Accounts from '@/components/Accounts.vue'; // @ is an alias to /src
import Categories from '@/components/Categories.vue';
import Transactions from '@/components/Transactions.vue';

@Component({
  components: {
    Accounts,
    Categories,
    Transactions,
  },
})
export default class Home extends Vue {
  get txns() {
    const txns: Txns.Txn[] =
      Object.values(this.$store.state.txns.txns).
      sort((a, b) => a.date < b.date ? 1 : -1);

    return txns;
  }
}
</script>
