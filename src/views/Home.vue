<template>
  <b-container fluid>
    <b-row>
      <b-col xs="12" lg="4">
        <b-tabs>
          <b-tab title="Categories" active>
            <Categories></Categories>
          </b-tab>

          <b-tab title="Accounts">
            <Accounts></Accounts>
          </b-tab>

          <b-tab title="Transactions" title-item-class="d-lg-none">
            <Transactions />
          </b-tab>
        </b-tabs>
      </b-col>

      <b-col xs="12" lg="8" class="d-none d-lg-block">
        <Transactions />
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
}
</script>
