<template>
  <b-tabs>
    <b-tab title="Categories" active>
      <Categories></Categories>
    </b-tab>

    <b-tab title="Accounts">
      <Accounts></Accounts>
    </b-tab>
  </b-tabs>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Accounts from '@/components/Accounts.vue'; // @ is an alias to /src
import Categories from '@/components/Categories.vue'; // @ is an alias to /src

@Component({
  components: {
    Accounts,
    Categories,
  },
})
export default class Home extends Vue {}
</script>
