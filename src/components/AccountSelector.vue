<template>
  <div class="field">
    <label class="label">Account</label>
    <div class="select">
      <div class="control">
        <select v-model="model.account">
          <option
            v-for="account in accounts"
            :key="account.name"
            :value="account.name"
          >
            {{account.name}}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: ['accounts', 'model'],
});
</script>