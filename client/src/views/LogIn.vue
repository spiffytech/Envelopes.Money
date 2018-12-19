<template>
  <v-form @submit.prevent="onSubmit">
    <v-container>
      <v-alert :value="isSuccess" type="success">You've logged in!</v-alert>
      <v-alert :value="formError" type="error">{{ formError }}</v-alert>

      <v-text-field v-model="email" label="Email" type="email" />
      <v-text-field v-model="password" label="Password" type="password" />
    </v-container>

    <v-btn type="submit">Log In</v-btn>
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
      formError: null as string | null,
      isSuccess: false,
    };
  },

  methods: {
    async onSubmit() {
      this.formError = null;

      try {
        await axios.post(
          `${endpoint}/login`,
          {email: this.email, password: this.password},
        );
        this.isSuccess = true;
        window.location.href = '/';
      } catch (ex) {
        if (!ex.response) {
          this.formError = 'Unknown error submitting form';
          return;
        }
        console.log(ex.response);
        console.log(ex.response.status, ex.response.data);
        this.formError = ex.response.data.error;
      }
    },
  },
});
</script>
