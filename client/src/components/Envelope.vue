<template>
  <div v-if="editing" class="envelope envelope-editing">
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

  <div class="envelope envelope-normal" v-else>
    <div class="envelope-name">{{balance.bucket.name}}</div>
    <div class="envelope-numbers">
      <div>{{balanceDollars}}</div>
      <div class="balance-target">{{balance.bucket.extra.interval}} {{targetBalanceDollars}}</div>
    </div>

    <div class="edit" @click="edit">Edit</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {toDollars} from '@/lib/currency';
import * as CommonTypes from '../../../common/lib/types';

export default Vue.extend({
  props: {balance: {type: Object}},

  computed: {
    balanceDollars(): string {
      return toDollars(this.balance.balance);
    },
    targetBalanceDollars(): string {
      return toDollars(this.balance.bucket.extra.target);
    },
  },

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
    },
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

  .envelope {
    background-color: var(--list-item-background-color);
    margin-bottom: var(--list-item-margin-bottom);
    padding: var(--list-item-padding);
    border-bottom: 2px solid var(--border-color);
  }

  .envelope-normal {
    display: flex;
    justify-content: space-between;
  }

  .envelope-name {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    font-size: 20px;
  }

  .envelope-numbers {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .balance-target {
    font-size: 14px;
    font-style: italic;
  }
</style>
