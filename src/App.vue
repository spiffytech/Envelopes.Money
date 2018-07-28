<template>
  <div id="app">
    <b-navbar toggleable="sm">
      <b-navbar-toggle target="navbar-collapse"></b-navbar-toggle>

      <b-navbar-brand>
        <router-link :to="{name: 'home'}">Hacker Budget</router-link>
      </b-navbar-brand>

      <b-collapse is-nav id="navbar-collapse">
        <b-navbar-nav v-if="loggedIn">
          <b-nav-item>
            <b-button size="sm" :to="{name: 'editTxn', params: {txnId: null}}">Add Transaction</b-button>
          </b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
          <b-nav-item v-if="syncing">
            <span v-html="syncIcon"></span>
          </b-nav-item>

          <b-nav-item v-if="!loggedIn">
            <router-link :to="{name: 'login'}">Log In</router-link>
          </b-nav-item>

          <b-nav-item v-if="loggedIn">
            <b-button variant="link" size="sm" @click="logout">Log Out</b-button>
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <b-alert v-if="showFlash" show :variant="flashType">{{flashMessage}}</b-alert>

    <router-view/>
  </div>
</template>

<script lang="ts">
/* tslint:disable-next-line:no-var-requires */
const octicons = require('octicons');
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class App extends Vue {
  get loggedIn() {
    return this.$store.getters.loggedIn;
  }

  public async logout() {
    await this.$store.dispatch('couch/logOut');
    this.$router.push({name: 'login'});
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
    return octicons.sync.toSVG();
  }
}
</script>

<style lang="scss">
</style>
