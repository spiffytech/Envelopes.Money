<template>
  <div>
    <h1>Balances</h1>
    <table>
      <tr>Account Balances</tr>
      <tr v-for="balance in accountBalances" :key="balance.bucket.id">
        <td>{{balance.bucket.name}}</td>
        <td>{{balance.balance}}</td>
      </tr>
      <tr>Envelopes</tr>
      <tr v-for="balance in envelopeBalances" :key="balance.bucket.id">
        <Envelope :balance="balance" />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as CommonTypes from '../../../common/lib/types';
import Envelope from './Envelope.vue';

export default Vue.extend({
  components: {Envelope},

  computed: {
    accountBalances(): CommonTypes.AccountBalance {
      return this.$store.getters['accounts/accountBalances'];
    },
    envelopeBalances(): CommonTypes.AccountBalance {
      return this.$store.getters['accounts/envelopeBalances'];
    },
  }
})
</script>

<style>
.number {
  text-align: right;
}
</style>
