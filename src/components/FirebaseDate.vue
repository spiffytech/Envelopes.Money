<template>
  <span>{{datestr}}</span>
</template>

<script lang="ts">
import Vue from 'vue';
import dateFns from 'date-fns';

export default Vue.extend({
  props: ['date'],
  computed: {
    datestr(): string {
      const date = new Date(this.date.seconds * 1000);
      return dateFns.format(date, 'YYYY-MM-DD');
    },
  },
});
</script>