<script>
  import * as Balances from './lib/Balances';
  import {toDollars} from './lib/pennies';

  export let balance;
  export let adjustment = 0;
  export let interval = 'monthly'

  $: prorated =
    Balances.isBalanceEnvelope(balance) ?
    Balances.calcAmountForPeriod(balance)['monthly'] :
    0;
</script>

<style>
.progress-flipped {
    transform: rotate(180deg);
}

.progress-flipped::-moz-progress-bar {
    background-color: #c65e21;
}

.progress-flipped::-webkit-progress-value {
    background-color: #c65e21;
}

.progress::-moz-progress-bar {
    background-color: #7bb026;
}
.progress::-webkit-progress-value {
    background-color: #7bb026;
}

.progress[value] {
    appearance: none;
}
.progress-flipped[value] {
    appearance: none;
}

</style>

<div class="font-bold">
  <div>{balance.name}</div>
  {#if Balances.isBalanceEnvelope(balance)}
    <progress
      class={(balance.balance + adjustment) < 0 ? 'progress-flipped' : 'progress'}
      value={Math.abs(balance.balance) + adjustment}
      max={balance.extra.target || 0}
    />
  {/if}
</div>

<div>
  <div class="text-right">{toDollars(balance.balance + adjustment)}</div>
  {#if Balances.isBalanceEnvelope(balance)}
    <div class="text-right text-xs italic">
      {toDollars(prorated)} / {interval}
    </div>
  {/if}
</div>
