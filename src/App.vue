<template>
  <div id="app">
    <div id="nav">
      <router-link :to="{name: 'home'}">Home</router-link> |
      <router-link :to="{name: 'login'}">Log In</router-link>
    </div>
    <b-alert v-if="showFlash" show :variant="flashType">{{flashMessage}}</b-alert>
    <router-view/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
})
export default class App extends Vue {
  get showFlash() {
    return Boolean(this.$store.state.flash);
  }

  get flashType() {
    return this.$store.state.flash.type === 'error' ? 'danger' : 'primary';
  }

  get flashMessage() {
    return this.$store.state.flash.msg;
  }
}
</script>

<style lang="scss">
</style>
