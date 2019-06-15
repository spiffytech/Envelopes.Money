<template>
  <div
    class="item flex-grow p-3 border border-gray-100 shadow-md rounded-lg m-3 bg-white"
    style="min-width:0"
  >
    <div class="flex justify-between">
      <div>
        <div class="text-sm small-caps">{{name}}</div>
        <div class="text-xl font-bold">{{currentBalance}}</div>
      </div>
      <div>
        <span
          class="p-2 border border-black rounded-lg"
        >{{periodOverPeriod >= 0 ? '🡅' : '🡇'}} {{periodOverPeriod.toFixed(2)}}</span>
      </div>
    </div>
    <svg ref="plotsvg" viewBox="0 0 400 100">
      <path :d="dZero" fill="none" stroke-width="2" stroke="black"></path>
      <path :d="d" fill="none" stroke-width="2" class="stroke-current text-gray-500"></path>
      <circle
        v-for="circle in circles"
        :key="circle.x"
        :cx="circle.x"
        :cy="circle.y"
        r="3"
        color="purple"
      >
        <title>{{circle.date}} - {{circle.data}}</title>
      </circle>
    </svg>
  </div>
</template>

<style scoped>
.item {
  flex-basis: 300px;
}
</style>

<script lang="ts">
import * as d3 from 'd3';
import tinydate from 'tinydate';
import Vue from 'vue';

import { durations } from '../lib/utils';
import { toDollars } from '../lib/pennies';
import { IAccount } from '../lib/types';

function calcDaysInPeriod(
  periodStart: Date,
  days = [],
  periodEnd = new Date()
): Date[] {
  const nextDate = new Date(periodStart.getTime() + 86400000);
  if (nextDate > periodEnd) return days;
  return calcDaysInPeriod(nextDate, [...days, nextDate], periodEnd);
}

export default Vue.extend({
  props: ['amounts', 'name', 'account', 'defaultDaysToRender'],
  computed: {
    daysToRender() {
      const account: IAccount = this.account;
      if (account.type === 'envelope') {
        console.log(durations);
        if (account.extra.interval === 'total') {
          return this.defaultDaysToRender + 1;
        }
        return durations[account.extra.interval] + 1;
      }
      return this.defaultDaysToRender + 1;
    },
    periodOverPeriod() {
      return (
        this.renderableDatapoints[this.renderableDatapoints.length - 1] -
        this.renderableDatapoints[0]
      );
    },
    currentBalance() {
      const currentDateStr = tinydate('{YYYY}-{MM}-{DD}')(new Date());
      return toDollars(this.amounts[currentDateStr]);
    },
    datesToRender() {
      return calcDaysInPeriod(
        new Date(new Date().getTime() - 86400000 * parseInt(this.daysToRender))
      );
    },
    renderableDatapoints() {
      return this.datesToRender.map(
        date => (this.amounts[tinydate('{YYYY}-{MM}-{DD}')(date)] || 0) / 100
      );
    },
    xScale() {
      return d3
        .scaleLinear()
        .domain([0, this.renderableDatapoints.length])
        .range([0 + 10, 400 - 10]);
    },
    yScale() {
      return (
        d3
          .scaleSqrt()
          .domain([
            Math.max(0, ...this.renderableDatapoints),
            Math.min(0, ...this.renderableDatapoints)
          ])
          // Add some margin to our scale so we have room to draw the dots
          .range([0 + 10, 100 - 10])
      );
    },
    circles() {
      return this.renderableDatapoints.map((data, i) => ({
        x: this.xScale(i),
        y: this.yScale(data),
        data,
        date: this.datesToRender[i]
      }));
    },
    d() {
      const lineFn = d3
        .line<number>()
        .x((_item, i) => this.xScale(i))
        .y(item => this.yScale(item));

      return lineFn(this.renderableDatapoints);
    },
    dZero() {
      const lineFn = d3
        .line<number>()
        .x((_item, i) => this.xScale(i))
        .y(_item => this.yScale(0));

      return lineFn(this.renderableDatapoints);
    }
  },
  data() {
    return {
      toDollars
    };
  }
});
</script>
