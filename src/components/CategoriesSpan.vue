<template>
  <span>
    {{categoriesArr.join(', ')}}
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: ['categories'],
  components: {
  },
  computed: {
    categoriesArr(): string[] {
      return (
        Object.keys(this.categories)
        .sort()
      )
    },
  },
});
</script>