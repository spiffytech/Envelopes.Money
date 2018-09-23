<template>
  <div id="app">
    <nav class="navbar level" role="navigation" aria-label="main navigation" style="margin-bottom: 0;">
      <div class="level-left">
        <div class="navbar-brand">
          <router-link :to="{name: 'home'}" class="navbar-item is-size-5 has-text-weight-bold">Hacker Budget</router-link>
        </div>

        <router-link
          :to="{name: 'editTxn', params: {txnId: null}}"
          class="navbar-item"
          style="color: inherit"
        >
          Add Transaction
        </router-link>

        <div class="navbar-item icon">
          <i v-if="syncing" class="fas fa-sync" />
        </div>
      </div>

      <div class="navbar-item level-right">
        <router-link
          :to="{name: 'editCategory', params: {txnId: null}}"
          class="navbar-item"
          style="color: inherit"
        >
          Add Category
        </router-link>

        <router-link :to="{name: 'login'}" v-if="!loggedIn" class="navbar-item">Log In</router-link>

        <button class="button navbar-item" @click="logout" v-if="loggedIn">Log Out</button>
      </div>
    </nav>

    <div class="notification" v-if="showFlash">{{flashMessage}}</div>

    <router-view/>
  </div>
</template>

<script lang="ts">
/* tslint:disable-next-line:no-var-requires */
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
}
</script>

<style lang="scss">
</style>
