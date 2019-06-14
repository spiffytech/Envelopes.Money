<template>
  <div class="bg-gray-300">
    <nav>
      <router-link to="/">Home</router-link>|
      <router-link to="/about">About</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import mkApollo from './lib/apollo';
import store from './store';

(window as any).store = store;

const credsJSON = localStorage.getItem('creds');
if (credsJSON) {
  const creds = JSON.parse(credsJSON);
  const graphql = {
    apollo: mkApollo(creds.apikey),
    userId: creds.userId,
    apikey: creds.apikey
  };
  store.dispatch('subscribeAll', graphql);
}

export default Vue.extend({});
</script>
