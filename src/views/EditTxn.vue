<template>
  <div>
    <b-form-select v-model="txnType" :options="txnTypeSelect" :disabled="!isNewTxn" />

    <EditBankTxn
      v-if="txn && txn.type === 'banktxn'"
      :txn="txn"
      :categories="categories"
      :accounts="accounts"
      :onSubmit="onSubmit.bind(this)"
    ></EditBankTxn>
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import Vue from 'vue';

import EditBankTxn from '@/components/EditBankTxn.vue';
import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

export default Vue.extend({
  components: {EditBankTxn},

  data() {
    return {
      txns: this.$store.state.txns.txns,
      txn: null as null | Txns.BankTxn,
      txnType: null,
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
      return Couch.upsertTxn(utils.activeDB(this.$store.state), txn);
    },

    async loadExistingTxn(id: string) {
      const db = utils.activeDB(this.$store.state);
      this.txn = await db.get<Txns.BankTxn>(id);
    },
  },

  mounted() {
    if (!this.isNewTxn) this.loadExistingTxn(this.existingTxnId!);
  }
});
</script>