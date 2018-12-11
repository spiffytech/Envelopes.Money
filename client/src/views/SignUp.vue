<template>
  <v-form @submit.prevent="onSubmit">
    <v-container>
      <v-alert :value="formError" type="error">{{ formError }}</v-alert>

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
      email: '',
      password: '',
      formError: null,
    };
  },

  methods: {
    async onSubmit() {
      this.formError = null;

      try {
        await axios.post(
          `${endpoint}/signup`,
          {email: this.email, password: this.password},
        );
      } catch (ex) {
        console.log(ex.response.status, ex.response.data);
        this.formError = ex.response.data.error;
      }
    },
  },
});
</script>
