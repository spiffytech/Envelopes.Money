<template>
  <form @submit.prevent="submit">
    <input type="radio" id="from-unallocated" value="unallocated" v-model="source" />
    <label>Unallocated</label>
    <!--
    <input type="radio" id="from-unallocated" value="income" v-model="source" />
    <label>Income</label>
    -->

    <table>
      <tr v-for="envelope in envelopes" :key="envelope.bucket.id">
        <label>{{envelope.bucket.name}}: {{envelope.balance}}</label>

        <input type="radio" :id="`radio-${envelope.bucket.id}`" value="add" v-model="fills[envelope.bucket.id].type">
        <label :for="`radio-${envelope.bucket.id}`">Add</label>

        <!--
        <input type="radio" :id="`radio-${envelope.bucket.id}`" value="set" v-model="fills[envelope.bucket.id].type">
        <label :for="`radio-${envelope.bucket.id}`">Set</label>
        -->

        <input type="number" v-model="fills[envelope.bucket.id].amount" />

        <span>{{ envelope.balance + parseInt(fills[envelope.bucket.id].amount) }}</span>
      </tr>
    </table>
    
    <button type="submit">Fill</button>
  </form> 
</template>

<script lang="ts">
import axios from 'axios';
import * as shortid from 'shortid';
import Vue from 'vue'

import * as CommonTypes from '../../../common/lib/types';

interface Fill {
  type: 'add' | 'set';
  amount: string | number;
}

export default Vue.extend({
  props: ['txnTuple'],

  computed: {
    envelopes(): CommonTypes.AccountBalance[] {
      const accountBalances: CommonTypes.AccountBalance[] = this.$store.getters['accounts/envelopes'];
      // We generate the fills in this computed so when a page loads and the
      // envelopes aren't around yet we still get the fills after the envelopes
      // load
      accountBalances.forEach(({bucket}) => {
        if (!this.fills[bucket.id]) Vue.set(this.fills, bucket.id, {type: 'add', amount: 0});
      })
      return accountBalances;
    }
  },

  /**
   * Import an existing transaction as a bunch of fill line items so we can edit
   * old fills
   */
  beforeMount() {
    if (!this.txnTuple) return;
    const {parts} = this.txnTuple as CommonTypes.TxnTuple;
    parts.forEach((part) => {
      if (!part.account_id) return;
      if(!this.fills[part.account_id]) {
        Vue.set(this.fills, part.account_id, {type: 'add', amount: part.amount});
      }
    });
  },

  // TODO: On a page reload, data returs an empty array becaus it runs before
  // our ajax finishes. So then computed runs, and can't match up with data.
  data() {
    return {
      source: 'unallocated' as 'unallocated' | 'income',
      fills: {} as {[id: string]: Fill},
    }
  },

  methods: {
    async submit() {
      if (this.source !== 'unallocated') throw new Error('Unsupported fill type');
      const transaction: CommonTypes.ITransaction = {
        id: shortid.generate(),
        user_id: this.$store.state.userId,
        memo: '',
        date: new Date(),
        amount:
          Object.values(this.fills).
          map(({amount}) => amount).
          reduce((a, b) => parseInt(a.toString()) + parseInt(b.toString()), 0) as number,
        label: 'Fill',
        type: 'envelopeTransfer',
      };

      // TODO: For both transaction and fill, convert from/to pennies in display
      // and submit()
      const partsUnbalanced: CommonTypes.ITransactionPart[] =
        Object.entries(this.fills).
        filter(([bucketId, fill]) => fill.amount !== 0).
        map(([bucketId, fill]): CommonTypes.ITransactionPart => ({
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount: parseInt(fill.amount.toString()),
          account_id: bucketId,
          user_id: this.$store.state.userId,
        }));

      const partsBalanced: CommonTypes.ITransactionPart[] = [
        // The other side of our double entry
        {
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount: -partsUnbalanced.reduce((acc, item) => acc + item.amount, 0),
          account_id: this.$store.getters['accounts/unallocated'].bucket.id as string,
          user_id: this.$store.state.userId,
        },
        ...partsUnbalanced.filter((part) => part.amount !== 0),
      ];

      const sum = partsBalanced.reduce((acc, item) => acc + item.amount, 0);

      // Sanity checking ourselves
      if (sum !== 0) throw new Error(`Amounts did not add up to 0: ${sum}`);


      // TODO: only allow submissions if values < [Unallocated] amount

      await this.$store.dispatch(
        'transactions/upsert',
        {transaction, parts: partsBalanced}
      );
    },
  },
})
</script>
