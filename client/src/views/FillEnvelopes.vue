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
        <label>{{envelope.bucket.name}}: {{toDollars(envelope.balance)}}</label>
        <span>{{
          toDollars(
            envelope.balance +
            parseFloat(fills[envelope.bucket.id].amount || 0) * 100
          )
        }}</span>

        <input type="radio" :id="`radio-${envelope.bucket.id}`" value="add" v-model="fills[envelope.bucket.id].type">
        <label :for="`radio-${envelope.bucket.id}`">Add</label>

        <!--
        <input type="radio" :id="`radio-${envelope.bucket.id}`" value="set" v-model="fills[envelope.bucket.id].type">
        <label :for="`radio-${envelope.bucket.id}`">Set</label>
        -->

        <input type="number" step="0.01" v-model="fills[envelope.bucket.id].amount" />
      </tr>
    </table>
    
    <button type="submit">Fill</button>
  </form> 
</template>

<script lang="ts">
import * as shortid from 'shortid';
import Vue from 'vue';

import * as CommonTypes from '../../../common/lib/types';
import * as TransactionPart from '../../../common/lib/TransactionPart';
import {toDollars} from '@/lib/currency';
import router from '@/router';

interface Fill {
  type: 'add' | 'set';
  amount: string | number;
}

export default Vue.extend({
  computed: {
    originalTxn(): CommonTypes.ITransaction | null {
      const tuple = this.$store.state.transactions.transactions[this.$route.query.txnId as string];
      if (tuple) return tuple.transaction;
      return null;
    },

    envelopes(): CommonTypes.AccountBalance[] {
      const accountBalances: CommonTypes.AccountBalance[] = this.$store.getters['accounts/envelopes'];
      // We generate the fills in this computed so when a page loads and the
      // envelopes aren't around yet we still get the fills after the envelopes
      // load
      accountBalances.forEach(({bucket}) => {
        if (!this.fills[bucket.id]) Vue.set(this.fills, bucket.id, {type: 'add', amount: 0});
      });
      return accountBalances;
    },
  },

  /**
   * Import an existing transaction as a bunch of fill line items so we can edit
   * old fills
   */
  beforeMount() {
    const txnTuple =
      this.$store.state.transactions.transactions[this.$route.query.txnId as string];
    if (!txnTuple) return;
    const {parts} = txnTuple as CommonTypes.TxnTuple;
    parts.forEach((part) => {
      if (!part.account_id) return;
      if (!this.fills[part.account_id]) {
        Vue.set(this.fills, part.account_id, {type: 'add', amount: part.amount / 100});
      }
    });
  },

  // TODO: On a page reload, data returs an empty array becaus it runs before
  // our ajax finishes. So then computed runs, and can't match up with data.
  data() {
    return {
      toDollars,
      source: 'unallocated' as 'unallocated' | 'income',
      fills: {} as {[id: string]: Fill},
    };
  },

  methods: {
    async submit() {
      if (this.source !== 'unallocated') throw new Error('Unsupported fill type');
      const transaction: CommonTypes.ITransaction = {
        id: this.originalTxn ? this.originalTxn.id : shortid.generate(),
        user_id: this.$store.state.userId,
        memo: '',
        date: this.originalTxn ? this.originalTxn.date : new Date(),
        amount:
          Object.values(this.fills).
          map(({amount}) => amount).
          reduce((a, b) => parseFloat(a.toString()) + parseFloat(b.toString()) * 100, 0) as number,
        label: 'Fill',
        type: 'envelopeTransfer',
      };

      // TODO: For both transaction and fill, convert from/to pennies in display
      // and submit()
      const partsUnbalanced: TransactionPart.T[] =
        Object.entries(this.fills).
        filter(([bucketId, fill]) => fill.amount !== 0).
        map(([bucketId, fill]): TransactionPart.T => ({
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount: parseFloat(fill.amount.toString()) * 100,
          account_id: bucketId,
          user_id: this.$store.state.userId,
        }));

      const partsBalanced: TransactionPart.T[] = [
        // The other side of our double entry
        {
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount: -TransactionPart.sum(partsUnbalanced),
          account_id: this.$store.getters['accounts/unallocated'].bucket.id as string,
          user_id: this.$store.state.userId,
        },
        ...partsUnbalanced.filter((part) => part.amount !== 0),
      ];

      const sum = TransactionPart.sum(partsBalanced);

      // Sanity checking ourselves
      if (sum !== 0) throw new Error(`Amounts did not add up to 0: ${sum}`);


      // TODO: only allow submissions if values < [Unallocated] amount

      await this.$store.dispatch(
        'transactions/upsert',
        {transaction, parts: partsBalanced},
      );
      await this.$store.dispatch('transactions/load');
      router.push({name: 'home'});
    },
  },
});
</script>
