<template>
  <div>
    <b-table :fields="tableFields" :items="txns" @row-clicked="rowClicked">
      <template slot="date" slot-scope="data">
        {{formatDate(data.value)}}
      </template>

      <template slot="type" slot-scope="data">
        <span v-if="data.item.type === 'banktxn'" v-html="banktxnIcon" title="Bank Transaction"></span>
        <span v-if="data.item.type === 'accountTransfer'" v-html="accountTransferIcon" title="Account Transfer"></span>
        <span v-if="data.item.type === 'envelopeTransfer'" v-html="envelopeTransferIcon" title="Envelope Transfer"></span>
      </template>

      <template slot="payee" slot-scope="data">
        <template v-if="data.item.type === 'banktxn'">
          <h6>{{data.item.payee}}</h6>
          <small>
            <span>{{data.item.account}}</span>
            •
            <span>{{Object.keys(data.item.categories).join(', ')}}</span>
          </small>
        </template>

        <template v-if="data.item.type === 'accountTransfer'">
          <h6>{{data.item.from}} ⇨ {{data.item.to}}</h6>
        </template>

        <template v-if="data.item.type === 'envelopeTransfer'">
          <h6>{{data.item.from}} ⇨ {{data.item.to}}</h6>
        </template>
      </template>

      <template slot="amount" slot-scope="data">
        {{formatAmount(data.value)}}
      </template>
    </b-table>

    <span ref="txnsScrollSentinel"></span>
  </div>
</template>

<script lang="ts">
/* tslint:disable:no-console */
/* tslint:disable:no-var-requires */
import {debounce} from 'lodash';
import {pipe, throttle} from 'lodash/fp';
const octicons = require('octicons');
import { Component, Prop, Vue } from 'vue-property-decorator';

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
