<template>
  <div id="app">
    <b-nav>
      <b-nav-item>
        <router-link :to="{name: 'home'}">Home</router-link> |
      </b-nav-item>

      <b-nav-item v-if="!loggedIn">
        <router-link :to="{name: 'login'}">Log In</router-link>
      </b-nav-item>

      <b-nav-item v-if="loggedIn">
        <b-button @click="logout">Log Out</b-button>
      </b-nav-item>

      <b-nav-item v-if="syncing">
        <span v-html="syncIcon"></span>
      </b-nav-item>
    </b-nav>

    <b-alert v-if="showFlash" show :variant="flashType">{{flashMessage}}</b-alert>

    <router-view/>
  </div>
</template>

<script lang="ts">
const octicons = require('octicons');
import { Component, Vue } from 'vue-property-decorator';

import router from '@/router';

@Component({})
export default class App extends Vue {
  get loggedIn() {
    return this.$store.getters.loggedIn;
  }

  public async logout() {
    await this.$store.dispatch('couch/logOut');
    router.push({name: 'home'});
  }

  get showFlash() {
    return Boolean(this.$store.state.flash);
  }

  get flashType() {
    return this.$store.state.flash.type === 'error' ? 'danger' : 'primary';
  }

  get flashMessage() {
    return this.$store.state.flash.msg;
  }

  get syncing() {
    return this.$store.state.syncing;
  }

  get syncIcon() {
    return octicons['sync'].toSVG();
  }
}
</script>

<style lang="scss">
</style>
