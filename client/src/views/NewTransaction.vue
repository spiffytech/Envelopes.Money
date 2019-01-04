<template>
  <form @submit.prevent="submit">
    <select v-model="selectedFrom" required>
      <option v-for="source in sourcesFrom" :value="source.bucket.id" :key="source.bucket.id">
        {{ source.bucket.name }}
      </option>
    </select>

    <div v-for="part in parts" :key="part.account_id">
      <select v-model="part.account_id" required>
        <option v-for="source in sourcesTo" :value="source.bucket.id" :key="source.bucket.id">
          {{ source.bucket.name }}
        </option>
      </select>

      <input type="number" step="0.01" v-model="part.amount" required />
    </div>


    <button type="submit">Save</button>
  </form>
</template>

<script lang="ts">
import axios from 'axios';
import fromPairs from 'lodash/fromPairs';
/* tslint:disable-next-line */
const mm = require('multimethod');
import property from 'lodash/property';
import * as shortid from 'shortid';
import Vue from 'vue';

import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '@/lib/currency';

const counterbalanceTransaction =
  mm().
  dispatch((tuple: CommonTypes.TxnBucketTuple) => tuple.transaction.type).
  when('envelopeTransfer', (tuple: CommonTypes.TxnBucketTuple) => tuple.parts).
  when('accountTransfer', (tuple: CommonTypes.TxnBucketTuple) => tuple.parts).
  when('banktxn', ({transaction, buckets, parts}: CommonTypes.TxnBucketTuple) => {
    /*
    const toBalance = parts.filter((part) => part.account_id !== null);
    const counterbalanceAmount =
      -toBalance.map((part) => part.amount).reduce((acc, item) => acc + item, 0);
    const counterbalance: CommonTypes.ITransactionPart[] = [
      ...parts,
      {
        id: shortid.generate(),
        transaction_id: transaction.id,
        amount: counterbalanceAmount,
        account_id: null,
        user_id: transaction.user_id,
      },
    ];

    return counterbalance;
    */

    // TODO: Does this function need to be this complex? We just need a single
    // counterbalance entry, right?
    const accounts = fromPairs(
      buckets.filter((bucket) => bucket.type === 'account').
      map((bucket) => [bucket.id, bucket]),
    );
    const envelopes = fromPairs(
      buckets.filter((bucket) => bucket.type === 'envelope').
      map((bucket) => [bucket.id, bucket]),
    );

    const sumAccounts =
      parts.filter((part) => accounts[part.account_id || 'null']).
      map((part) => part.amount).reduce((acc, item) => acc + item, 0);

    const sumEnvelopes =
      parts.filter((part) => envelopes[part.account_id || 'null']).
      map((part) => part.amount).reduce((acc, item) => acc + item, 0);

    const counterbalance: CommonTypes.ITransactionPart[] = [
      ...parts,
      {
        id: shortid.generate(),
        transaction_id: transaction.id,
        amount: -sumEnvelopes,
        account_id: null,
        user_id: transaction.user_id,
      },
      {
        id: shortid.generate(),
        transaction_id: transaction.id,
        amount: -sumAccounts,
        account_id: null,
        user_id: transaction.user_id,
      },
    ];

    return counterbalance;
  });

export default Vue.extend({
  computed: {
    sourcesFrom(): CommonTypes.AccountBalance[] {
      return this.accounts;
    },

    sourcesTo(): CommonTypes.AccountBalance[] {
      return this.envelopes;
    },
  },

  data() {
    return {
      accounts: this.$store.getters['accounts/accountBalances'],
      envelopes: this.$store.getters['accounts/envelopeBalances'],
      selectedFrom: null,
      parts: [{account_id: null, amount: '0'}],
    };
  },

  methods: {
    async submit() {
      const amount =
        this.parts.map((part) => parseFloat(part.amount)).
        reduce((acc, item) => acc + item, 0) * 100;

      const transaction: CommonTypes.ITransaction = {
        id: shortid.generate(),
        user_id: this.$store.state.userId,
        memo: '',
        date: new Date(),
        amount,
        label: '',
        type: 'banktxn',
      };

      const partsUnbalanced: CommonTypes.ITransactionPart[] = [
        {
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount,
          account_id: this.selectedFrom,
          user_id: this.$store.state.userId,
        },
        ...this.parts.map((part) => ({
          id: shortid.generate(),
          transaction_id: transaction.id,
          amount: -parseFloat(part.amount) * 100,
          account_id: part.account_id,
          user_id: this.$store.state.userId,
        })),
      ];

      const tuple: CommonTypes.TxnBucketTuple = {
        transaction,
        parts: partsUnbalanced,
        buckets: this.$store.getters['accounts/buckets'],
      };
      const partsBalanced = counterbalanceTransaction(tuple);

      await this.$store.dispatch(
        'transactions/upsert',
        {transaction, parts: partsBalanced},
      );
    },
  },
});
</script>
