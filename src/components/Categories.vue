<template>
  <b-list-group>
    <b-list-group-item v-for="category in categories" :key="category.category.name">
      {{category.name}}
    </b-list-group-item>
  </b-list-group>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class Categories extends Vue {
  get categories() {
    // This stuff should get computed in the store: {balance, category}[]
    return this.$store.getters['txns/categoryBalances'];
  }
}
</script>