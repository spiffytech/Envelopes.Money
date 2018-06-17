<template>
  <span>
    <span v-for="[category, amount] in categoriesArr" :key="category">
      {{category}}: <Amount :amount="amount"></Amount>
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import Amount from './Amount.vue';

export default Vue.extend({
  props: ['categories'],
  components: {
    Amount,
  },
  computed: {
    categoriesArr(): [string, number][] {
      return (
        Object.keys(this.categories)
        .sort().
        map((category) => [category, this.categories[category]] as [string, number])
      )
    },
  },
});
</script>