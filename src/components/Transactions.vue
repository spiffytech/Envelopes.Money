<template>
  <div>
    <b-table :fields="fields" :items="txns" @row-clicked="rowClicked">
      <template slot="date" slot-scope="data">
        {{formatDate(data.value)}}
      </template>

      <template slot="type" slot-scope="data">
        <span v-if="data.item.type === 'banktxn'" v-html="banktxnIcon"></span>
        <span v-if="data.item.type === 'accountTransfer'" v-html="accountTransferIcon"></span>
        <span v-if="data.item.type === 'envelopeTransfer'" v-html="envelopeTransferIcon"></span>
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
import {pipe, tap} from 'lodash/fp';
const octicons = require('octicons');
import { Component, Prop, Vue } from 'vue-property-decorator';

import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';
import router from '@/router';
import * as StoreTypes from '@/store/types';

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

  private txnsScrollWatcher: NodeJS.Timer | null = null;

  public rowClicked(txn: Txns.Txn) {
    router.push({name: 'editTxn', params: {txnId: txn._id}});
  }

  private formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }

  private get banktxnIcon() {
    return octicons['credit-card'].toSVG();
  }

  private get accountTransferIcon() {
    return octicons.code.toSVG();
  }

  private get envelopeTransferIcon() {
    return octicons['git-compare'].toSVG();
  }

  private checkVisible(elm: any) {
    var rect = elm.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    const ret = rect.top >= 0 &&
      rect.left >= 0 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      elm.offsetParent !== null;
    // console.log(rect, window.innerHeight || document.documentElement.clientHeight, elm.offsetParent, ret);
    return ret;
  }

  mounted() {
    (window as any).tss = this.$refs.txnsScrollSentinel;
    const tss = this.$refs.txnsScrollSentinel;
    console.log(tss);
    console.log('mounted');
    console.log('visible', this.$el.offsetParent);
    /*
    setInterval(
      () => console.log('tssop', this.$el.offsetParent && (tss as any).offsetParent),
      5000
    );
    */
    this.txnsScrollWatcher = setInterval(
      pipe(
        () => this.checkVisible(tss),
        tap((visible) => visible && console.log('Loading more txns')),
        (visible) => visible && this.$store.commit('txns/addVisibleTxns', 20)
      ),
      400
    );
  }

  beforeDestroy() {
    console.log('Destroying txns component');
    if (this.txnsScrollWatcher) clearInterval(this.txnsScrollWatcher);
  }
}
</script>
