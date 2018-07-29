<template>
  <div>
    <b-form-select v-model="txn.type" :options="txnTypeSelect" :disabled="!isNewTxn" />

    <EditBankTxn
      v-if="txn.type === 'banktxn'"
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
      txn: this.$store.state.txns.txns[this.$route.params.txnId] || {type: null},
    };
  },

  computed: {
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
  },
});
</script>