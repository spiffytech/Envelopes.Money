<template>
  <EditBankTxn
    v-if="txn && txn.type === 'banktxn'"
    :txn="txn"
    :categories="categories"
    :onSubmit="onSubmit.bind(this)"
  ></EditBankTxn>
</template>

<script lang="ts">
/* tslint:disable:no-console */
import { Component, Vue } from 'vue-property-decorator';

import EditBankTxn from '@/components/EditBankTxn.vue';
import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';

@Component({components: {EditBankTxn}})
export default class EditTxn extends Vue {
  get txn() {
    return this.$store.state.txns.txns[this.txnId];
  }

  get txnId() {
    return this.$route.params.txnId;
  }

  get categories() {
    const categories: Txns.Category[] = Object.values(this.$store.state.txns.categories);
    return categories.sort((a, b) => a.name < b.name ? -1 : 1);
  }

  private onSubmit(txn: Txns.Txn) {
    return Couch.upsertTxn(this.$store.state.couch.pouch, txn);
  }
}
</script>