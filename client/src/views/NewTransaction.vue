<template>
  <form @submit.prevent="submit">
    <button @click.prevent="deleteTxn" v-if="this.originalTxn">Delete</button>

    <label>Total amount</label>
    <input type="number" step="1.00" v-model="total" @input="setTotal" />

    <select v-model="transactionType" @change="typeChange">
      <option value="banktxn">Bank Transaction</option>
      <option value="envelopeTransfer">Envelope Transfer</option>
      <option value="accountTransfer">Account Transfer</option>
    </select>

    <select v-model="selectedFrom" required>
      <option v-for="source in sourcesFrom" :value="source.bucket.id" :key="source.bucket.id">
        {{ source.bucket.name }}
      </option>
    </select>

    <div v-for="part in parts" :key="part.account_id">
      <select v-model="part.account_id" required>
        <option
          v-for="source in sourcesTo"
          :value="source.bucket.id"
          :key="source.bucket.id"
        >
          {{ source.bucket.name }}
        </option>
      </select>

      <input type="number" step="0.01" v-model="part.amount" @input="() => setDirty(part)" required />
    </div>

    <button @click.prevent="addPart">Add part</button>

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
import * as TransactionPart from '../../../common/lib/TransactionPart';
import {toDollars} from '@/lib/currency';
import router from '@/router';

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
      TransactionPart.sum(parts.filter((part) => accounts[part.account_id || 'null']));

    const sumEnvelopes =
      TransactionPart.sum(parts.filter((part) => envelopes[part.account_id || 'null']));

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
      if (this.fromType === 'account') return this.accounts;
      return this.envelopes;
    },

    sourcesTo(): CommonTypes.AccountBalance[] {
      if (this.toType === 'account') return this.accounts;
      return this.envelopes;
    },

    originalTxn(): CommonTypes.ITransaction | null {
      const tuple = this.$store.state.transactions.transactions[this.$route.query.txnId as string];
      if (tuple) return tuple.transaction;
      return null;
    },

    transactionId(): string {
      if (this.originalTxn) return this.originalTxn.id;
      return shortid.generate();
    },

    transactionDate(): Date {
      if (this.originalTxn) return this.originalTxn.date;
      return new Date();
    },

    fromType(): string {
      switch (this.transactionType) {
        case 'banktxn': return 'account';
        case 'envelopeTransfer': return 'envelope';
        case 'accountTransfer': return 'account';
        default: throw new Error(`Undefined transaction type ${this.transactionType}`);
      }
    },

    toType(): string {
      switch (this.transactionType) {
        case 'banktxn': return 'envelope';
        case 'envelopeTransfer': return 'envelope';
        case 'accountTransfer': return 'account';
        default: throw new Error(`Undefined transaction type ${this.transactionType}`);
      }
    },
  },

/**
 * If we're viewing an existing transaction load it up
 */
  beforeMount() {
    const txnTuple: CommonTypes.TxnBucketTuple | undefined =
      this.$store.state.transactions.transactions[this.$route.query.txnId as string];
    if (!txnTuple) return;

    const fromPart = txnTuple.parts.find((part) =>
      this.$store.state.accounts.balances[part.account_id || 'null'].bucket.type === this.fromType,
    );
    if (!fromPart) throw new Error('No from part matching our transaction type');
    this.selectedFrom = fromPart.account_id;

    if (this.originalTxn) this.total = toDollars(-this.originalTxn.amount);

    Vue.set(this, 'parts', []);
    txnTuple.parts.
    // Filter out counterbalance parts
    filter((part) => part.account_id).
    // Filter out the 'from' item
    filter((part) => this.sourcesTo.find((source) => source.bucket.id === part.account_id)).
    forEach(({account_id, amount}) => {
      if (!account_id) return;
      this.parts.push({account_id, amount: toDollars(-amount), dirty: true});
    });
  },

  data() {
    return {
      total: '0',
      transactionType: 'banktxn' as CommonTypes.TxnTypes,
      accounts: this.$store.getters['accounts/accountBalances'],
      envelopes: this.$store.getters['accounts/envelopeBalances'],
      selectedFrom: null as string | null,
      parts: [{account_id: null as string | null, amount: '0', dirty: false}],
    };
  },

  methods: {
    async submit() {
      const amount =
        this.parts.map((part) => parseFloat(part.amount)).
        reduce((acc, item) => acc + item, 0) * 100;

      const transaction: CommonTypes.ITransaction = {
        id: this.transactionId,
        user_id: this.$store.state.userId,
        memo: '',
        date: this.transactionDate,
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
      router.push({name: 'home'});
    },

    async deleteTxn() {
      await this.$store.dispatch(
        'transactions/delete',
        {transaction: this.originalTxn},
      );
      await this.$store.dispatch('transactions/load');
      router.push({name: 'home'});
    },

    /**
     * Clear out the form when the user changes transaction types
     */
    typeChange() {
      Vue.set(this, 'parts', [{account_id: null, amount: '0'}]);
      this.selectedFrom = null;
    },

    /**
     * Given an input event to the 'total' input field, fnd the first non-dirty
     * part and calculate the amount it needs to make the parts equal the total
     */
    setTotal(e: any) {
      const partToChange = this.parts.find((part) => part.dirty === false);
      if (!partToChange) return;
      const partsSum =
        this.parts.
        filter((part) => part.dirty).
        map((part) => parseFloat(part.amount.toString()) || 0).
        reduce((acc, item) => acc + item, 0);
      partToChange.amount = (parseFloat(e.target.value) - partsSum).toFixed(2);

    },

    setDirty(part: any) {
      part.dirty = true;
    },

    addPart() {
      this.parts.push({account_id: null, amount: '0', dirty: false});
    },
  },
});
</script>
