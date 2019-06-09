<template>
  <form v-on:submit.prevent="handleSubmit" class="content">
    <header class='font-bold'>Log In</header>

    <p v-if='error'>{{error}}</p>

    <label>
      Email
      <input
        type='email'
        placeholder='you@example.com'
        class='border w-full'
        v-model='email'
        required
      />
    </label>

    <label>
      Password
      <input
        type='password'
        placeholder='password'
        class='border w-full'
        v-model='password'
        required
      />
    </label>

    <button type='submit' class='btn btn-primary'>Log In</button>
  </form>
</template>

<script lang="ts">
import axios from 'axios';
import Vue from 'vue'

import {endpoint} from '../lib/config';

export default Vue.extend({
  data() {
    return {
      error: null,
      email: '',
      password: '',
      endpoint,
    };
  },

  methods: {
    async handleSubmit() {
      try {
        const response = await axios.post(
          `${endpoint}/login`, {email: this.email, password: this.password}
        );
        const creds = {userId: response.data.userId, apikey: response.data.apikey};
        window.localStorage.setItem('creds', JSON.stringify(creds));
        this.$router.push('home');
        location.reload();  // Force the new context to get set
      } catch (ex) {
        this.error = ex.response.data.error;
      }

    }
  },
})
</script>
