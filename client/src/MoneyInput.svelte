<script>
  import { createEventDispatcher } from 'svelte';

  import { toDollars } from './lib/pennies';

  const dispatch = createEventDispatcher();

  export let amount = 0;
  export let defaultType = 'debit';
  let type = defaultType;

  let content;
  $: content = (Math.abs(amount) / 100).toString();

  $: {
    const newAmount = parseFloat(content);
    if ((newAmount === 0 || newAmount) && newAmount !== amount) {
      dispatch(
        'change',
        Math.round(newAmount * (type === defaultType ? 1 : -1) * 100)
      );
    }
  }
</script>

<div class="flex flex-no-wrap">
  <input
    type="number"
    step="0.01"
    bind:value={content}
    placeholder={toDollars(amount)}
    class="inline-block border w-24" />

  <select
    bind:value={type}
    class={`inline-block border ${type === 'debit' ? 'bg-red-100' : 'bg-green-100'}`}>
    <option value="debit" class="bg-red-100">Debit</option>
    <option value="credit" class="bg-green-100">Credit</option>
  </select>
</div>
