<template>
  <b-form @submit="onSubmit">
    <b-form-group
      label="Username"
      label-for="username"
    >
      <b-form-input id="username" v-model="username" required></b-form-input>
    </b-form-group>

    <b-form-group
      label="Password"
      label-for="password"
    >
      <b-form-input id="password" type="password" v-model="password" required></b-form-input>
    </b-form-group>

    <b-button type="submit" variant="primary">Log In</b-button>
  </b-form>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import router from '@/router';

/* tslint:disable:no-console */

@Component({
  components: {
  },
})
export default class Login extends Vue {
  public username = '';
  public password = '';

  public async onSubmit(event: any) {
    event.preventDefault();
    await this.$store.dispatch('couch/logIn', {username: this.username, password: this.password});
    router.push({name: 'home'});
  }
}
</script>