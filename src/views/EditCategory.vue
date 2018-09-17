<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Name</label>
      <div class="control">
        <input class="input" required v-model="model.name" />
      </div>
    </div>

    <div class="field">
      <label class="label">Target balance</label>
      <div class="control">
        <input v-model="model.target.human" class="input" type="number" step="0.01" />
      </div>
    </div>

    <div class="field">
      <label class="label">Interval</label>
      <div class="select">
        <select v-model="model.interval">
          <option
            v-for="option in intervalOptions"
            :key="option.value"
            :value="option.value"
          >
            {{option.text}}
          </option>
        </select>
      </div>
    </div>

    <div class="field">
      <label class="label">Due on</label>
      <div class="control">
        <input class="input" type="date" v-model="model.dateString" />
      </div>
    </div>

    <button class="button" type="submit">Save</button>
  </form>
</template>

<script lang="ts">
import Vue from 'vue';

import Category from '@/lib/Category';
import * as Couch from '@/lib/couch';
import * as Txns from '@/lib/txns';
import * as utils from '@/lib/utils';

export default Vue.extend({
  data() {
    return {
      model: Category.Empty(),
      intervalOptions: [
        {text: 'Weekly', value: 'weekly'},
        {text: 'Monthly', value: 'monthly'},
        {text: 'Yearly', value: 'yearly'},
        {text: 'Once', value: 'once'},
      ],
    };
  },

  computed: {
    isNewCategory(): boolean {
      return !Boolean(this.$route.params.categoryId);
    },
  },

  async beforeMount() {
    if (!this.isNewCategory) {
      this.model = this.$store.getters['txns/categories'][this.$route.params.categoryId];
    }
  },

  methods: {
    handleSubmit() {
      return Couch.upsertCategory(utils.activeDB(this.$store.state), this.model.toPOJO());
    },
  },
});
</script>