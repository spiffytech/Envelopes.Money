<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.dateString" />
      </div>
    </div>

    <label class="label">From</label>
    <div class="field is-grouped">
      <div class="control">
        <div class="select">
          <select v-model="model.from.name" required>
            <option v-for="category in categories" :key="category.name" :value="category.name">
              {{category.name}}
            </option>
          </select>
        </div>
      </div>
    </div>

    <label class="label">To</label>
    <div
      class="field is-grouped"
      v-for="(modelCategory, i) in model.to"
      :key="'categorySelector-' + i"
    >
      <div class="control">
        <div class="select">
          <select
            :value="modelCategory.bucketName"
            @change="(event) => model.setToByName(categories, event.target.value, i)"
            required
          >
            <option
              v-for="category in categories"
              :key="category.name"
              :value="category.name"
            >
              {{category.name}}
            </option>
          </select>
        </div>
      </div>

      <div class="control">
        <input v-model="model.amount.human" class="input" type="number" step="0.01" />
      </div>
    </div>

    <div class="field">
      <div class="control">
        <button class="button" type="button" @click="addCategory">Add Category</button>
      </div>
    </div>

    <div class="field">
      <label class="label">Memo</label>
      <div class="control">
        <input v-model="model.memo" class="input" />
      </div>
    </div>

    <button class="button" type="submit">Save</button>
  </form>
</template>

<script lang="ts">
import * as Monet from 'monet';
import Vue from 'vue';

import Amount from '@/lib/Amount';
import EnvelopeTransfer from '@/lib/EnvelopeTransfer';
import * as Txns from '@/lib/txns';
import CategorySelector from './CategorySelector.vue';

export default Vue.extend({
  props: ['categories', 'onSubmit', 'txn'],
  components: { CategorySelector },
  data() {
    return {
      model: (this.txn as Monet.Maybe<Txns.EnvelopeTransfer>).
        map((txn) => EnvelopeTransfer.POJO(txn)).
        orSome(EnvelopeTransfer.Empty()),
    };
  },

  beforeMount() {
    this.model.debitMode = true;
  },

  beforeDestroy() {
    this.$store.commit('clearFlash');
  },

  methods: {
    addCategory() {
      this.model.addTo({
        name: this.categories[0].name,
        id: this.categories[0]._id,
        amount: Amount.Pennies(0),
      });
    },

    handleSubmit(_event: any) {
      this.$store.commit('clearFlash');

      this.model.debitMode = false;
      this.onSubmit(this.model);
      this.model.debitMode = true;
    },
  },
});
</script>
