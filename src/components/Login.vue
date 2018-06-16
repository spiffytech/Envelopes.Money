<template>
  <v-form>
    <h1>Login</h1>
    <v-text-field
      label="Email"
      type="email"
      v-model="email"
    ></v-text-field>

    <v-btn @click="submit">Log In</v-btn>
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      hidePassword: true,
      email: '',
    }
  },
  async mounted() {
    await this.$store.dispatch('tryFinishLogIn');
  },
  methods: {
    submit() {
      return this.$store.dispatch(
        'logIn',
        {email: this.email}
      );
    }
  },
});
</script>