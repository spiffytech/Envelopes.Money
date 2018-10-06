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
import Vue from 'vue';

import Amount from '@/lib/Amount';
import BucketAmount from '@/lib/BucketAmount';
import EnvelopeTransfer from '@/lib/EnvelopeTransfer';
import { TxnPOJO } from '@/lib/Transaction';
import transactionFactory from '@/lib/TransactionFactory';
import {Empty} from '@/lib/TransactionFactory';
import * as Txns from '@/lib/txns';
import CategorySelector from './CategorySelector.vue';

export default Vue.extend({
  props: ['categories', 'onSubmit', 'txn'],
  components: { CategorySelector },
  data() {
    return {
      model: this.txn,
    };
  },

  beforeDestroy() {
    this.$store.commit('clearFlash');
  },

  updated() {
    this.model = this.txn;
  },

  methods: {
    addCategory() {
      this.model.addTo(BucketAmount.POJO({
        bucketRef: {
          name: this.categories[0].name,
          id: this.categories[0]._id,
          type: 'category',
        },
        amount: 0,
      }));
    },

    handleSubmit(_event: any) {
      this.$store.commit('clearFlash');

      this.onSubmit(this.model);
    },
  },
});
</script>
