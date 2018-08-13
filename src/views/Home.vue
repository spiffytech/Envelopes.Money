<template>
  <div class="ui grid">
      <div class="five wide column">
        <div class="ui top attached tabular menu" ref="menu">
          <a class="active item" data-tab="Categories">Categories</a>
          <a class="item" data-tab="Accounts">Accounts</a>
          <a class="item" data-tab="Transactions">Transactions</a>
        </div>

        <div class="ui bottom attached active tab segment" data-tab="Categories"><Categories></Categories></div>
        <div class="ui bottom attached tab segment" data-tab="Accounts"><Accounts></Accounts></div>
        <div class="ui bottom attached tab segment" data-tab="Transactions"><Transactions /></div>
      </div>

      <div class="eleven wide column">
        <Transactions />
      </div>
  </div>
</template>

<script lang="ts">
import jQuery from 'jquery';
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
  public mounted() {
    (jQuery('.item', this.$refs.menu) as any).tab();
  }
}
</script>
