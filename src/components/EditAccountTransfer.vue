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
        <input v-model="model.amount.human" class="input" type="number" step="0.01" required />
      </div>
    </div>

    <div class="field">
      <label class="label">From</label>
      <div class="select">
        <div class="control">
          <select
            v-model="model.from.name"
            @change="(event) => model.setFromByName(accounts, event.target.value)"
            required
          >
            <option
              v-for="account in accounts"
              :key="account.name"
              :value="account.name"
            >
              {{account.name}}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="label">To</label>
      <div class="select">
        <div class="control">
          <select
            v-model="model.to[0].bucketName"
            @change="(event) => model.setToByName(accounts, event.target.value, 1)"
            required
          >
            <option
              v-for="account in accounts"
              :key="account.name"
              :value="account.name"
            >
              {{account.name}}
            </option>
          </select>
        </div>
      </div>
    </div>

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

  beforeDestroy() {
    this.$store.commit('clearFlash');
  },

  methods: {
    handleSubmit() {
      this.$store.commit('clearFlash');

      this.onSubmit(this.model);
    },
  },
});
</script>
