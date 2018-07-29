<template>
  <div>
    <b-table :fields="fields" :items="txns" @row-clicked="rowClicked">
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
            <span>{{data.item.accountName}}</span>
            •
            <span>{{Object.keys(data.item.categoryNames).join(', ')}}</span>
          </small>
        </template>

        <template v-if="data.item.type === 'accountTransfer'">
          <h6>{{data.item.fromName}} ⇨ {{data.item.toName}}</h6>
        </template>

        <template v-if="data.item.type === 'envelopeTransfer'">
          <h6>{{data.item.fromName}} ⇨ {{data.item.toName}}</h6>
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
import {pipe, throttle} from 'lodash/fp';
const octicons = require('octicons');
import { Component, Prop, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

@Component({})
export default class Transactions extends Vue {
  @Prop({type: Array})
  public txns!: Txns.Txn[];

  @Prop({type: Object})
  public accounts!: {[key: string]: Txns.Account};

  @Prop({type: Object})
  public categories!: {[key: string]: Txns.Category};

  public fields = ['date', 'type', 'payee', 'memo', 'amount'];

  public formatDate = utils.formatDate;

  public txnsScrollWatcher: NodeJS.Timer | null = null;

  public rowClicked(txn: Txns.Txn) {
    this.$router.push({name: 'editTxn', params: {txnId: txn._id}});
  }

  public mounted() {
    const tss = this.$refs.txnsScrollSentinel;
    const addVisible = throttle(500, () => {
      console.log('Loading more txns');
      this.$store.commit('txns/addVisibleTxns', 20);
    });

    this.txnsScrollWatcher = setInterval(
      pipe(
        () => this.checkVisible(tss),
        (visible) => visible && addVisible(),
      ),
      250,
    );
  }

  public beforeDestroy() {
    console.log('Destroying txns component');
    if (this.txnsScrollWatcher) clearInterval(this.txnsScrollWatcher);
  }

  public formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }

  public get banktxnIcon() {
    return octicons['credit-card'].toSVG();
  }

  public get accountTransferIcon() {
    return octicons.code.toSVG();
  }

  public get envelopeTransferIcon() {
    return octicons['git-compare'].toSVG();
  }

  public checkVisible(elm: any) {
    const rect = elm.getBoundingClientRect();
    const ret = rect.top >= 0 &&
      rect.left >= 0 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      elm.offsetParent !== null;
    // console.log(rect, window.innerHeight || document.documentElement.clientHeight, elm.offsetParent, ret);
    return ret;
  }
}
</script>
