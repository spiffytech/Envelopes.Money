<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/signup" v-if="!$store.state.isAuthed">Sign Up</router-link> |
      <router-link to="/login" v-if="!$store.state.isAuthed">Log In</router-link>
      <router-link to="/fill" v-if="$store.state.isAuthed">Fill Envelopes</router-link> |
      <router-link to="/newTransaction" v-if="$store.state.isAuthed">New Transaction</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
});
</script>


<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
