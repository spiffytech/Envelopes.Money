<template>
  <FillEnvelopes
    v-if="type === 'fill'"
    :originalTxn={originalTxn}
    :envelopeBalances={envelopes}
  />
  <NewTransaction
    v-else
    :originalTxn={originalTxn}
  />
</template>

<script lang="ts">
import FillEnvelopes from '@/views/FillEnvelopes.vue';
import NewTransaction from '@/views/NewTransaction.vue';
import Vue from 'vue';

import * as CommonTypes from '../../../common/lib/types';
import * as TransactionPart from '../../../common/lib/TransactionPart';
import {toDollars} from '@/lib/currency';
import router from '@/router';

export default Vue.extend({
  components: {FillEnvelopes, NewTransaction},

  computed: {
    type(): string {
      return this.$route.query.type as string;
    },

    originalTxn(): CommonTypes.ITransaction | null {
      const tuple = this.$store.state.transactions.transactions[this.$route.query.txnId as string];
      if (tuple) return tuple.transaction;
      return null;
    },

    envelopes(): CommonTypes.AccountBalance[] {
      return this.$store.getters['accounts/envelopes'];
    },
  },
});
</script>
