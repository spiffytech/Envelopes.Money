<template>
  <div class="m-3">
    <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
      Sort by:
      <select v-model="sortBy">
        <option value="name">Name</option>
        <option value="balance">Balance</option>
        <option value="period-over-period">Period-Over-Period</option>
      </select>
    </div>

    <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
      <header class="font-bold text-lg small-caps cursor-pointer" @click="toggleShowAccounts">
        <span>›</span> Accounts
      </header>
    </div>
    <div v-if="showAccounts" class="flex flex-wrap -m-3">
      <router-link
        :to="{name: 'account', params: {accountId: account.id}}"
        v-for="{account, balances} in accountBalances"
        :key="account.id"
        style="display: contents;"
      >
        <Balance
          :amounts="balances"
          :name="account.name"
          :defaultDaysToRender="16"
          :account="account"
        />
      </router-link>
    </div>

    <div class="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
      <header class="font-bold text-lg small-caps cursor-pointer">Envelopes</header>Group by:
      <select v-model="sortTag">
        <option :value="null">No Tag</option>
        <option v-for="tag in this.allTags" :key="tag" :value="tag">{{tag}}</option>
      </select>
    </div>

    <div v-for="tagValue in envelopeTagValues" :key="tagValue">
      <header class="small-caps">
        {{sortTag || 'No tag selected'}}:
        <span
          class="font-bold small-caps"
        >{{tagValue === 'null' ? 'No Value' : tagValue}}</span>
      </header>
      <div class="flex flex-wrap -m-3">
        <router-link
          :to="{name: 'account', params: {accountId: account.id}}"
          v-for="{account, balances} in envelopesByTag[tagValue]"
          :key="account.id"
          style="display: contents;"
        >
          <Balance
            :amounts="balances"
            :name="account.name"
            :defaultDaysToRender="16"
            :account="account"
          />
        </router-link>
      </div>
    </div>
  </div>
</template>

<style>
.small-caps {
  font-variant: small-caps;
}
</style>

<script lang="ts">
import tinydate from 'tinydate';
import flatten from 'lodash/flatten';
import fromPairs from 'lodash/fromPairs';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';
import Vue from 'vue';

import { Balance as BalanceT, TxnGrouped } from '../lib/types';
import Balance from '../components/Balance.vue';

function calcDaysInPeriod(
  periodStart: Date,
  days = [],
  periodEnd = new Date()
) {
  const nextDate = new Date(periodStart.getTime() + 86400000);
  if (nextDate > periodEnd) return days;
  return calcDaysInPeriod(nextDate, [...days, nextDate], periodEnd);
}

export default Vue.extend({
  name: 'home',
  components: {
    Balance
  },
  computed: {
    daysToRender() {
      return 16;
    },

    sortFn() {
      const currentDateStr = tinydate('{YYYY}-{MM}-{DD}')(new Date());
      return {
        name: (a, b) => (a.account.name < b.account.name ? -1 : 1),
        balance: (a, b) =>
          a.balances[currentDateStr] < b.balances[currentDateStr] ? -1 : 1,
        'period-over-period': (a, b) => {
          const datesToRender = calcDaysInPeriod(
            new Date(new Date().getTime() - 86400000 * this.daysToRender)
          );
          const amountsArrA = datesToRender.map(
            date => a.balances[tinydate('{YYYY}-{MM}-{DD}')(date)] || 0
          );
          const diffA = amountsArrA[amountsArrA.length - 1] - amountsArrA[0];

          const amountsArrB = datesToRender.map(
            date => b.balances[tinydate('{YYYY}-{MM}-{DD}')(date)] || 0
          );
          const diffB = amountsArrB[amountsArrB.length - 1] - amountsArrB[0];

          console.log(diffA, diffB);
          return diffA < diffB ? -1 : 1;
        }
      }[this.sortBy];
    },

    accountBalances() {
      return this.$store.getters.accountBalances.slice().sort(this.sortFn);
    },
    envelopeBalances() {
      return this.$store.getters.envelopeBalances.slice().sort(this.sortFn);
    },

    allTags() {
      return uniq(
        flatten(
          this.envelopeBalances.map(envelope =>
            Object.keys(envelope.account.tags)
          )
        ).sort()
      );
    },
    envelopesByTag() {
      return groupBy(this.envelopeBalances, envelope =>
        this.sortTag ? envelope.account.tags[this.sortTag] : null
      );
    },
    envelopeTagValues() {
      return Object.keys(this.envelopesByTag).sort();
    }
  },
  data() {
    return {
      showAccounts: false,
      sortBy: 'name',
      sortTag: null
    };
  },
  methods: {
    toggleShowAccounts() {
      this.showAccounts = !this.showAccounts;
    }
  }
});
</script>
