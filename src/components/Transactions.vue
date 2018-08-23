<template>
  <div>
    <table class="table">
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
            <i v-if="txn.type === 'banktxn'" class="fas fa-credit-card" title="Bank Transaction" />
            <i v-if="txn.type === 'accountTransfer'" class="fas fa-exchange-alt" title="Account Transfer" />
            <i v-if="txn.type === 'envelopeTransfer'" class="fas fa-envelope" title="Envelope Transfer" />
          </span>
        </td>

        <td>
          <template v-if="txn.type === 'banktxn'">
            <p class="header">{{txn.payee}}</p>
            <small>
              <span>{{txn.account}}</span>
              •
              <span>{{txn.categories.map(({name}) => name).join(', ')}}</span>
            </small>
          </template>

          <template v-if="txn.type === 'accountTransfer'">
            <small>{{txn.from}} ⇨ {{txn.to}}</small>
          </template>

          <template v-if="txn.type === 'envelopeTransfer'">
            <small>{{txn.from}} ⇨ {{txn.to}}</small>
          </template>
        </td>

        <td>{{txn.memo}}</td>

        <td>
          {{formatAmount(txn.amount)}}
        </td>
      </tr>
    </table>

    <span ref="txnsScrollSentinel"></span>
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
/* tslint:disable:no-var-requires */
import {debounce} from 'lodash';
import {pipe, throttle} from 'lodash/fp';
const octicons = require('octicons');
import Vue from 'vue';

import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

export default Vue.extend({
  data() {
    return {
      txns: [] as Txns.Txn[],
      visibleTxns: 20,
      txnsSubscription: null as any | null,
      tableFields: ['date', 'type', 'payee', 'memo', 'amount'],
      formatDate: utils.formatDate,
      txnsScrollWatcher: null as NodeJS.Timer | null,
    };
  },

  props: ['accounts', 'categories'],

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

  computed: {
    banktxnIcon() {
      return octicons['credit-card'].toSVG();
    },

    accountTransferIcon() {
      return octicons.code.toSVG();
    },

    envelopeTransferIcon() {
      return octicons['git-compare'].toSVG();
    },
  },

  methods: {
    rowClicked(txn: Txns.Txn) {
      this.$router.push({name: 'editTxn', params: {txnId: txn._id}});
    },

    addVisibleTxns(n = 30) {
      const numTxns = Object.keys(this.txns).length;
      this.visibleTxns = Math.min(numTxns + n, this.visibleTxns as number + n);
    },

    async fetchTxns() {
      const setTxns = (txns: Array<Txns.Txn | undefined>) => Vue.set(
        this,
        'txns',
        txns.filter((txn) => txn !== undefined) as Txns.Txn[],
      );

      const db = utils.activeDB(this.$store.state);
      await Couch.getTxns(db, this.visibleTxns).map(setTxns).promise();

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
          () => Couch.getTxns(db, this.visibleTxns).map(setTxns).promise(),
          1000,
          {trailing: true},
        ),
      );
      this.txnsSubscription.on('error', console.error);
    },

    beforeDestroy() {
      console.log('Destroying txns component');
      if (this.txnsScrollWatcher) clearInterval(this.txnsScrollWatcher);
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
  },
});
</script>
