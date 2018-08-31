<template>
  <form @submit="onSubmit">
    <div class="field">
      <label class="label">Username</label>
      <div class="control">
        <input class="input" v-model="username" required />
      </div>
    </div>

    <div class="field">
      <label class="label">Password</label>
      <div class="control">
        <input class="input" type="password" v-model="password" required />
      </div>
    </div>

    <button class="button" type="submit">Log In</button>
  </form>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

/* tslint:disable:no-console */

@Component({})
export default class Login extends Vue {
  public username = '';
  public password = '';

  public async onSubmit(event: any) {
    event.preventDefault();
    await this.$store.dispatch('couch/logIn', {username: this.username, password: this.password});
    this.$router.push({name: 'home'});
  }

  public mounted() {
    if (this.$store.getters.loggedIn) {
      this.$router.push({name: 'home'});
    }
  }
}
</script>