<template>
  <v-form @submit.prevent="onSubmit">
    <v-container>
      <v-text-field v-model="authToken" label="Auth Token" />

      <v-text-field v-model="email" label="Email" type="email" />
      <v-text-field v-model="password" label="Password" type="password" />
    </v-container>

    <v-btn type="submit">Sign Up</v-btn>
  </v-form>
</template>

<script lang="ts">
import axios from 'axios';
import Vue from 'vue';

import {endpoint} from '@/lib/config';

export default Vue.extend({
  data() {
    return {
      authToken: '',

      email: '',
      password: '',
    };
  },

  methods: {
    async onSubmit() {
      alert(`${this.email}, ${this.password}`);

      await axios.post(
        `${endpoint}/signup`,
        {email: this.email, password: this.password},
        {headers: {'Authorization': this.authToken}},
      );
    },
  },
});
</script>
