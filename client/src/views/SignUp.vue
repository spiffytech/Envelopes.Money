<template>
  <form @submit.prevent="onSubmit">
    <div :value="isSuccess" type="success">You've signed up!</div>
    <div :value="formError" type="error">{{ formError }}</div>

    <label>Email</label>
    <input v-model="email" type="email" />
    <label>Password</label>
    <input v-model="password" type="password" />

    <button type="submit">Sign Up</button>
  </form>
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
          `${endpoint}/signup`,
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
