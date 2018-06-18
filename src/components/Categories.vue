<template>
  <div>
    <v-list>
      <v-list-tile
        v-for="category of Array.from(this.$store.getters.categoryBalances.values())"
        :key="category.name"
      >
        <v-list-tile-content>
          <span><span>{{category.name}}</span>: <Amount :amount="category.balance"></Amount></span>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Amount from './Amount.vue';
export default Vue.extend({
  components: {
    Amount,
  }
});
</script>