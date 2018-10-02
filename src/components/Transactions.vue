<template>
  <div>
    <div style="display: flex; justify-content: space-between;">
      <h1>Transactions</h1>
      <button class="button" @click="() => exportTransactionsAsCSV()">Export Transactions</button>
    </div>

    <table class="table" style="width: 100%;">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Payee</th>
          <th>Memo</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tr v-for="txn in txns" :key="txn._id" @click="() => rowClicked(txn)">
        <td nowrap>
          {{formatDate(txn.date)}}
        </td>

        <td>
          <span class="icon">
            <i :class="{fas: true, [getTxnIcon(txn)]: true}" :title="getTxnLabel(txn)" />
          </span>
        </td>

        <td>
          <template v-if="txn.type === 'banktxn'">
            <p class="header">{{txn.payee}}</p>
            <small>
              <span>{{txn.from.name}}</span>
              •
              <span>{{txn.to.map((to) => to.bucketName).join(', ')}}</span>
            </small>
          </template>

          <template v-if="txn.type === 'accountTransfer'">
            <small>{{txn.from.name}} ⇨ {{txn.to[0].bucketName}}</small>
          </template>

          <template v-if="txn.type === 'envelopeTransfer'">
            <small>
              {{txn.from.name}} 
              ⇨ 
              {{txn.to.map((to) => to.bucketName).join(', ')}}
              </small>
          </template>
        </td>

        <td style="min-width=10em;">{{txn.memo}}</td>

        <td>
          {{txn.amount.human}}
        </td>
      </tr>
    </table>

    <span ref="txnsScrollSentinel"></span>
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
/* tslint:disable:no-var-requires */
import debounce from 'lodash/debounce';
import {pipe, throttle} from 'lodash/fp';
import {saveAs} from 'file-saver';
import Vue from 'vue';

import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import Transaction from '@/lib/Transaction';
import transactionFactory from '@/lib/TransactionFactory';
import * as utils from '@/lib/utils';

export default Vue.extend({
  data() {
    return {
      txns: [] as Array<Transaction<any>>,
      visibleTxns: 20,
      txnsSubscription: null as any | null,
      tableFields: ['date', 'type', 'payee', 'memo', 'amount'],
      formatDate: utils.formatDate,
      txnsScrollWatcher: null as NodeJS.Timer | null,
    };
  },

  mounted() {
    const tss = this.$refs.txnsScrollSentinel;
    const addVisible = throttle(500, () => {
      console.log('Loading more txns');
      this.addVisibleTxns();
    });

    this.txnsScrollWatcher = setInterval(
      pipe(
        () => this.checkVisible(tss),
        (visible) => visible && addVisible(),
      ),
      250,
    );

    this.$watch(
      ((vm: any) => [vm.visibleTxns, utils.activeDB(this.$store.state)]) as any,
      this.fetchTxns.bind(this),
      {immediate: true},
    );
  },

  beforeDestroy() {
    console.log('Destroying txns component');
    if (this.txnsScrollWatcher) clearInterval(this.txnsScrollWatcher);
    this.txnsSubscription.cancel();
  },

  methods: {
    rowClicked(txn: Transaction<any>) {
      this.$router.push({name: 'editTxn', params: {txnId: txn.id}});
    },

    addVisibleTxns(n = 30) {
      const numTxns = this.txns.length;
      this.visibleTxns = Math.min(numTxns + n, this.visibleTxns as number + n);
    },

    async fetchNewTxns() {
      const setTxns = (txns: Array<Transaction<any>>) => Vue.set(this, 'txns', txns);

      const db = utils.activeDB(this.$store.state);
      const docs = await Couch.getTxns(db, this.visibleTxns);
      setTxns(docs.filter((e) => e !== undefined))
    },

    async fetchTxns() {
      const db = utils.activeDB(this.$store.state);
      if (this.txnsSubscription) this.txnsSubscription.cancel();

      this.txnsSubscription = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
        selector: {$or: [
          {type: 'banktxn'},
          {type: 'accountTransfer'},
          {type: 'envelopeTransfer'},
          {_deleted: true},
        ]},
      });
      this.txnsSubscription.on(
        'change',
        // We use debounce because multiple refleshes get going at once and
        // finish out of order
        debounce(
          async () => this.fetchNewTxns(),
          1000,
          {trailing: true},
        ),
      );
      this.txnsSubscription.on('error', console.error);

      await this.fetchNewTxns();
    },

    formatAmount(amount: Txns.Pennies): string {
      return utils.formatCurrency(Txns.penniesToDollars(amount));
    },

    checkVisible(elm: any) {
      const rect = elm.getBoundingClientRect();
      const ret = rect.top >= 0 &&
        rect.left >= 0 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        elm.offsetParent !== null;
      // console.log(rect, window.innerHeight || document.documentElement.clientHeight, elm.offsetParent, ret);
      return ret;
    },

    async exportTransactionsAsCSV() {
      const db = utils.activeDB(this.$store.state);
      const txns = await Couch.getTxns(db, Number.MAX_SAFE_INTEGER);
      const csv =
        txns.
        map((txn) => txn.export()).
        map((e) => [
          utils.formatDate(e.date),
          e.amount.dollars.toFixed(2),
          e.from,
          e.to,
          e.memo,
          e.type,
          (e as any).payee  // TODO: Need a better way to handle this. Export as JSON instead of CSV?
        ].join(',')).
        join('\n');

      const blob = new Blob([csv], {type: 'text/csv'});
      saveAs(blob, 'transactions.csv');
    },

    getTxnIcon(txn: Transaction<any>): string {
      return txn.withType((type) => ({
        banktxn: 'fa-credit-card',
        accountTransfer: 'fa-exchange-alt',
        envelopeTransfer: 'fa-envelope',
      }[type]))
    },

    getTxnLabel(txn: Transaction<any>): string {
      return txn.withType((type) => ({
        banktxn: 'Bank Transaction',
        accountTransfer: 'Account Transfer',
        envelopeTransfer: 'Envelope Transfer',
      }[type]))
    },
  },
});
</script>
