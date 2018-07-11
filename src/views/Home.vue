<template>
  <Categories></Categories>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Categories from '@/components/Categories.vue'; // @ is an alias to /src

@Component({
  components: {
    Categories,
  },
})
export default class Home extends Vue {}
</script>
