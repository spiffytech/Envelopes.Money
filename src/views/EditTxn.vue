<template>
  <div>
    <a class="button" @click="deleteTransaction" v-if="txn">
      <span class="icon">
        <i class="fas fa-trash-alt" title="Delete Transaction" />
      </span>
    </a>

    <div class="select">
      <select :value="txnType" @change="(e) => setTxnType(event.target.value)" :disabled="!isNewTxn">
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

    <EditAccountTransfer
      v-else-if="txnType === 'accountTransfer'"
      :txn="txn"
      :accounts="accounts"
      :onSubmit="onSubmit.bind(this)"
    />
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import Vue from 'vue';

import EditAccountTransfer from '@/components/EditAccountTransfer.vue';
import EditBankTxn from '@/components/EditBankTxn.vue';
import EditEnvelopeTransfer from '@/components/EditEnvelopeTransfer.vue';
import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import Transaction, { TxnPOJO } from '@/lib/Transaction';
import {Empty} from '@/lib/TransactionFactory';
import * as Types from '@/lib/types';
import * as utils from '@/lib/utils';

export default Vue.extend({
  components: {EditAccountTransfer, EditBankTxn, EditEnvelopeTransfer},

  data() {
    return {
      txns: this.$store.state.txns.txns,
      txn: Empty('banktxn') as Transaction<any>,
    };
  },

  computed: {
    txnType(): string {
      return this.txn.withType((type) => type);
    },

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
        {value: 'accountTransfer', text: 'Account Transfer'},
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
    setTxnType(type: Types.txnTypes) {
      this.txn = Empty(type);
    },

    async onSubmit(txn: Transaction<any>) {
      if (txn.errors()) {
        return this.$store.commit('setFlash', {
          msg: txn.errors()!.join(', '),
          type: 'error',
        });
      }
      await Couch.upsertTxn(utils.activeDB(this.$store.state), txn);
      this.$router.push({name: 'home'});
    },

    async loadExistingTxn(id: string) {
      const db = utils.activeDB(this.$store.state);
      try {
        this.txn = await Couch.getTxn(db, id);
      } catch (ex) {
        console.log(ex);
        this.txn = Empty('banktxn');
      }
    },

    async deleteTransaction() {
      if (!this.txn) return;
      await utils.activeDB(this.$store.state).remove(this.txn.toPOJO() as any);
      this.$router.push({name: 'home'});
    },
  },

  async beforeMount() {
    if (!this.isNewTxn) {
      await this.loadExistingTxn(this.existingTxnId!);
    }
  },
});
</script>
