<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.dateString" />
      </div>
    </div>

    <div class="field">
      <label class="label">Amount</label>
      <div class="control">
        <input v-model="model.amount.human" class="input" type="number" step="0.01" />
      </div>
    </div>

    <AccountSelector :accounts="accounts" :model="model.from" />

    <AccountSelector :accounts="accounts" :model="model.to" />

    <div class="field">
      <label class="label">Memo</label>
      <div class="control">
        <input v-model="model.memo" class="input" />
      </div>
    </div>

    <button class="button" type="submit">Save</button>
  </form>
</template>

<script lang="ts">
import * as Monet from 'monet';
import Vue from 'vue';

import AccountTransfer from '@/lib/AccountTransfer';
import * as Txns from '@/lib/txns';

import AccountSelector from './AccountSelector.vue';

export default Vue.extend({
  props: ['accounts', 'onSubmit', 'txn'],
  components: {AccountSelector},
  data() {
    return {
      model: (this.txn as Monet.Maybe<Txns.AccountTransfer>).
        map((txn) => AccountTransfer.POJO(txn)).
        orSome(AccountTransfer.Empty()),
    };
  },

  beforeMount() {
    this.model.toggleDebit();
  },

  methods: {
    handleSubmit() {
      this.$store.commit('clearFlash');

      this.model.toggleDebit();
      this.onSubmit(this.model);
    },
  },
});
</script>
