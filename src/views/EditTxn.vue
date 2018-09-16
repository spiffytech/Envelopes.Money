<template>
  <div>
    <a class="button" @click="deleteTransaction" v-if="txn">
      <span class="icon">
        <i class="fas fa-trash-alt" title="Delete Transaction" />
      </span>
    </a>

    <div class="select">
      <select v-model="txnType" :disabled="!isNewTxn">
        <option
          v-for="option in txnTypeSelect"
          :key="option.value"
          :disabled="option.value === null"
          :value="option.value"
        >
          {{option.text}}
        </option>
      </select>
    </div>

    <EditBankTxn
      v-if="txnType === 'banktxn'"
      :txn="txn"
      :categories="categories"
      :accounts="accounts"
      :onSubmit="onSubmit.bind(this)"
    />

    <EditEnvelopeTransfer
      v-else-if="txnType === 'envelopeTransfer'"
      :txn="txn"
      :categories="categories"
      :onSubmit="onSubmit.bind(this)"
    />
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import * as Monet from 'monet';
import Vue from 'vue';

import EditBankTxn from '@/components/EditBankTxn.vue';
import EditEnvelopeTransfer from '@/components/EditEnvelopeTransfer.vue';
import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

export default Vue.extend({
  components: {EditBankTxn, EditEnvelopeTransfer},

  data() {
    return {
      txns: this.$store.state.txns.txns,
      txn: Monet.None() as Monet.Maybe<Txns.BankTxn | Txns.EnvelopeEvent | Txns.AccountTransfer>,
      txnType: null as null | string,
    };
  },

  computed: {
    existingTxnId(): string | undefined {
      return this.$route.params.txnId;
    },

    isNewTxn(): boolean {
      return !Boolean(this.$route.params.txnId);
    },

    txnTypeSelect() {
      return [
        {value: null, text: 'Select a transaction type'},
        {value: 'banktxn', text: 'Bank Transaction'},
        {value: 'envelopeTransfer', text: 'Envelope Transfer'},
      ];
    },

    accounts() {
      const accounts: Txns.Account[] = Object.values(this.$store.state.txns.accounts);
      return accounts.sort((a, b) => a.name < b.name ? -1 : 1);
    },

    categories() {
      const categories: Txns.Category[] = Object.values(this.$store.state.txns.categories);
      return categories.sort((a, b) => a.name < b.name ? -1 : 1);
    },
  },

  methods: {
    onSubmit(txn: Txns.Txn) {
      console.log(txn);
      return Couch.upsertTxn(utils.activeDB(this.$store.state), txn);
    },

    async loadExistingTxn(id: string) {
      const db = utils.activeDB(this.$store.state);
      const txn = await db.get<Txns.BankTxn>(id);
      this.txn = Monet.Some(txn);
      this.txnType = txn.type;
    },

    deleteTransaction() {
      if (!this.txn) return;
      return utils.activeDB(this.$store.state).remove(this.txn as any);
    },
  },

  async mounted() {
    if (this.isNewTxn) {
      this.txn = Monet.None();
    } else {
      await this.loadExistingTxn(this.existingTxnId!);
    }
  },
});
</script>