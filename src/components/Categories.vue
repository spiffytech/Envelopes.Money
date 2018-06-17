<template>
  <div>
    <h1>Categories</h1>
    <v-list>
      <v-list-tile
        v-for="category of Array.from(this.$store.getters.categoryBalances.values())"
        :key="category.name"
      >
        <v-list-tile-content>
          {{category}}
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({

});
</script>