<template>
<v-list-tile>
  <v-list-tile-content>
    <v-list-tile-title>{{txn.payee}}</v-list-tile-title>
    <v-list-tile-sub-title class="text--primary">{{txn.amount}}</v-list-tile-sub-title>
    <v-list-tile-sub-title>{{txn.categories}}</v-list-tile-sub-title>
  </v-list-tile-content>

  <v-list-tile-action>
  <v-list-tile-action-text>{{txn.date}}</v-list-tile-action-text>
  </v-list-tile-action>
</v-list-tile>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from "vue-property-decorator"

import {BankEvent} from '../lib/txns';

@Component
export default class Transaction extends Vue {
  @Prop({
    type: Object
  })
  txn: BankEvent;
}
</script>

<style scoped>
</style>