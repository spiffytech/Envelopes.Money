<template>
  <div id="app">
    <div class="ui menu">
      <div class="header item">
        <router-link :to="{name: 'home'}">Hacker Budget</router-link>
      </div>

      <div class="item">
        <router-link :to="{name: 'editTxn', params: {txnId: null}}">Add Transaction</router-link>
      </div>

      <div class="right menu">
        <div class="item">
          <i v-if="syncing" class="sync icon" />
        </div>

        <div class="item" v-if="!loggedIn">
          <router-link :to="{name: 'login'}">Log In</router-link>
        </div>

        <div class="item" v-if="loggedIn">
          <button class="ui secondary basic button" @click="logout">Log Out</button>
        </div>
      </div>
    </div>

    <div class="ui message" v-if="showFlash">{{flashMessage}}</div>

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
