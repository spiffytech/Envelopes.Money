<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.dateString" />
      </div>
    </div>

    <label class="label">From</label>
    <CategorySelector
      :categories="categories"
      :model="model.from"
    />

    <label class="label">To</label>
    <CategorySelector
      v-for="(categoryModel, i) in model.to"
      :key="categoryModel.name + i"
      :categories="categories"
      :model="model.to[i]"
    />

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

      if (this.model.from.amount.pennies !== this.model.to.map((to) => to.amount.pennies).reduce((x, y) => x + y, 0)) {
        this.$store.commit('setFlash', {
          msg: 'From/to amounts must add up',
          type: 'error',
        });
        throw new Error('From/To amounts don\'t add up');
      }

      this.model.debitMode = false;
      this.onSubmit(this.model);
      this.model.debitMode = true;
    },
  },
});
</script>