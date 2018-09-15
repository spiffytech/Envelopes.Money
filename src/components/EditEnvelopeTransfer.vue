<template>
  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label class="label">Date</label>
      <div class="control">
        <input class="input" type="date" required v-model="model.date" />
      </div>
    </div>

    <label class="label">From</label>
    <CategorySelector
      :categories="categories"
      :model="model.fromDollars"
    />

    <label class="label">To</label>
    <CategorySelector
      v-for="(categoryModel, i) in model.toDollars"
      :key="categoryModel.name + i"
      :categories="categories"
      :model="model.toDollars[i]"
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
import Vue from "vue";

import CategorySelector from "./CategorySelector.vue";
import * as Txns from "@/lib/txns";
import * as utils from "@/lib/utils";

interface Model extends Partial<Txns.EnvelopeTransfer> {
  fromDollars: { name: string; id: string; amount: string };
  toDollars: Array<{ name: string; id: string; amount: string }>;
}

export default Vue.extend({
  props: ['categories', 'onSubmit', 'txn'],
  components: { CategorySelector },
  data() {
    return {
      model: this.txn ?
        (this as any).txnToModel(this.txn) :
        (this as any).emptyModel(),
    };
  },
  
  methods: {
    txnToModel(txn: Txns.EnvelopeTransfer): Model {
      return {
        ...txn,
        date: utils.formatDate(txn.date),
        fromDollars: {
          ...txn.from,
          amount: Txns.penniesToDollars(
            txn.from.amount
          ).toFixed(2)
        },
        toDollars: txn.to.map(to => ({
          ...to,
          amount: Txns.penniesToDollars(to.amount).toFixed(2)
        }))
      };
    },

    emptyModel(): Model {
      return {
        fromDollars: {name: this.categories[0].name, id: this.categories[0].id, amount: '0.00'},
        toDollars: [],
      };
    },

    addCategory() {
      this.model.toDollars.push({
        name: this.categories[0].name,
        id: this.categories[0]._id,
        amount: '0',
      });
    },

    handleSubmit(event: any) {
      const model: Model = this.model;
      this.$store.commit('clearFlash');
      const date = new Date(model.date || new Date());
      const txn: Txns.EnvelopeTransfer = {
        _id: model._id || Txns.idForEnvelopeTransfer(date),
        date: date.toJSON(),
        amount: Txns.stringToPennies(model.fromDollars.amount),
        memo: model.memo || '',
        from: {...model.fromDollars, amount: Txns.stringToPennies(model.fromDollars.amount)},
        to: model.toDollars.map((to) => ({...to, amount: Txns.stringToPennies(to.amount)})),
        type: 'envelopeTransfer',
      };

      if (txn.from.amount !== txn.to.map((to) => to.amount).reduce((x, y) => x + y, 0)) {
        this.$store.commit('setFlash', {
          msg: 'From/to amounts must add up',
          type: 'error',
        });
        throw new Error('From/To amounts don\'t add up');
      }
      this.onSubmit(txn);
    }
  },
});
</script>