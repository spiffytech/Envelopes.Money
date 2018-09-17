<template>
  <div class="columns">
      <div class="column is-one-third">
        <div class="tabs" style="margin-bottom: 0;">
          <ul>
            <li :class="{'is-active': $route.name === 'home/categories' || $route.name === 'home'}">
              <router-link :to="{name: 'home'}">Categories</router-link>
            </li>
            <li :class="{'is-active': $route.name === 'home/accounts'}">
              <router-link :to="{name: 'home/accounts'}">Accounts</router-link>
            </li>
            <li :class="{'is-active': $route.name === 'home/transactions', 'is-hidden-tablet': true}">
              <router-link :to="{name: 'home/transactions'}">Transactions</router-link>
            </li>
          </ul>
        </div>

        <div><router-view /></div>
      </div>

      <div class="column is-two-thirds">
        <Transactions />
      </div>
  </div>
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
