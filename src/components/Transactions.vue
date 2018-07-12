<template>
  <b-table :fields="fields" :items="txns">
    <template slot="date" slot-scope="data">
      {{formatDate(data.value)}}
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
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import * as utils from '@/lib/utils';
import * as StoreTypes from '@/store/types';

@Component({props: {txns: Array}})
export default class Transactions extends Vue {
  public fields = ['date', 'type', 'payee', 'memo', 'amount'];

  public formatDate = utils.formatDate;

  private formatAmount(amount: Txns.Pennies): string {
    return utils.formatCurrency(Txns.penniesToDollars(amount));
  }
}
</script>