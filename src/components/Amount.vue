<template>
  <span>{{formatted}}</span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    amount: Number,
    invert: Boolean,
  },
  computed: {
    localetStr(): string {
      return Intl.NumberFormat(
        navigator.language || 'en-US',
        {style: 'currency', currency: 'USD'}
      ).format(this.amount / 100);
    },

    formatted(): string {
      if (this.amount < 0) {
        return this.localetStr;
      } else {
        return `+${this.localetStr}`;
      }
    },
  },
});
</script>