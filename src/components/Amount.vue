<template>
  <span>{{amountStr}}</span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: ['amount'],
  computed: {
    amountStr(): string {
      return Intl.NumberFormat(
        navigator.language || 'en-US',
        {style: 'currency', currency: 'USD'}
      ).format(this.amount / 100 * -1);
    },
  },
});
</script>