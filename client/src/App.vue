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
:root {
  --grey-1: #f7f7f7;
  --grey-2: #e1e1e1;
  --grey-3: #cfcfcf;
  --grey-4: #b1b1b1;
  --grey-5: #9e9e9e;
  --grey-6: #7e7e7e;
  --grey-7: #626262;
  --grey-8: #515151;
  --grey-9: #3b3b3b;
  --grey-10: #222222;

  --page-bg: var(--grey-1);

  --component-bg: white;
  --component-padding: 24px;

  --list-item-margin-bottom: 12px;
  --list-item-padding: 12px;
  --list-item-background-color: white;

  --border-color: var(--grey-4);
  --border-radius-medium: 10px;
}

h1, h2, h3, h4, h5, h6 {
  text-align: left;
  margin-top: 12px;
  margin-bottom: 12px;
  padding-top: 24px;
  padding-bottom: 24px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

  background-color: var(--page-bg);
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
