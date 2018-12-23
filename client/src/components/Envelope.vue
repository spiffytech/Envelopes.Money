<template>
  <div v-if="editing">
    <form @submit.prevent="saveEnvelope">
      <label>Envelope name</label>
      <input v-model="balance.bucket.name" />

      <label>Target balance</label>
      <input v-model="balance.bucket.extra.target" type="number" />

      <label>Interval</label>
      <select v-model="balance.bucket.extra.interval">
        <option value="weekly">Weekly</option>
        <option value="twoweeks">Every two weeks</option>
        <!-- Support this in the future when we can store the two dates -->
        <!--<option value="semimonthly">Semi-monthly</option>-->
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="total">Total</option>
      </select>

      <button type="submit">Save</button>
    </form>
  </div>

  <div class="envelope" v-else>
    <td>{{balance.bucket.name}}</td>
    <td class="number">
      {{balance.balance}} <br>
      {{balance.bucket.extra.target}}
    </td>
    <td>{{balance.bucket.extra.interval}}</td>

    <td class="edit" @click="edit">Edit</td>
  </div>
</template>

<script>
import Vue from 'vue';
import * as CommonTypes from '../../../common/lib/types';

export default Vue.extend({
  props: ['balance'],

  data() {
    return {
      editing: false,
    };
  },

  methods: {
    edit() {
      this.editing = true;
    },

    async saveEnvelope() {
      await this.$store.dispatch('accounts/saveEnvelope', this.balance.bucket);
      this.editing = false;
    }
  },
});
</script>

<style scoped>
  .envelope .edit {
    display: none;
  }
  .envelope:hover .edit {
    display: inherit;
  }
</style>
