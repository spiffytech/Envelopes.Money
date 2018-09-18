<template>
  <div class="field is-grouped">
    <div class="control">
      <div class="select">
        <select v-model="model.name" required>
          <option v-for="category in categories" :key="category.name" :value="category.name">
            {{category.name}}
          </option>
        </select>
      </div>
    </div>

    <div class="control">
      <input v-model="model.amount.human" class="input" type="number" step="0.01" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: ['categories', 'model'],
});
</script>