<template>
  <div class="hello">
    <router-link :to="{name: 'login'}" v-if="!this.$store.getters.loggedIn">Log In</router-link>
    <p>Email: {{this.$store.state.email}}</p>
    <h1>Domain: {{ domain }}</h1>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'HelloWorld',
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
