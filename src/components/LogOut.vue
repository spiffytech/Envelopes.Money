<template>
  <v-btn @click="logout" v-if="this.$store.getters.loggedIn">Log Out</v-btn>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  methods: {
    logout() {
      return this.$store.dispatch('logOut');
    }
  }
});
</script>

<style>

</style>
