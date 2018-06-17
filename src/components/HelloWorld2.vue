<template>
  <div class="hello">
    <router-link :to="{name: 'login'}" v-if="!this.$store.getters.loggedIn">Log In</router-link>
    <LogOut></LogOut>
    <p>Email: {{this.$store.state.email}}</p>
    <Transactions></Transactions>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import LogOut from './LogOut.vue';
import Transactions from './Transactions.vue';
import Categories from './Categories.vue';

export default Vue.extend({
  name: 'HelloWorld',
  components: {
    Categories,
    LogOut,
    Transactions,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      domain: process.env.VUE_APP_DOMAIN
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
