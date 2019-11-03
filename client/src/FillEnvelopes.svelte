<script>
  import fromPairs from 'ramda/es/fromPairs';
  import page from 'page';
  import * as shortid from 'shortid';
  import { getContext } from 'svelte';

  import Balance from './Balance.svelte';
  import * as Balances from './lib/Balances';
  import { toDollars } from './lib/pennies';
  import { formatDate } from './lib/utils';
  import saveTransactions from './lib/transactions/saveTransactions';

  const accountsStore = getContext('accountsStore');
  const transactionsStore = getContext('transactionsStore');
  const dexie = getContext('dexie');
  const balancesStore = getContext('balancesStore');
  const intervalStore = getContext('intervalStore');

  const envelopes = $accountsStore.filter(
    account => account.type === 'envelope'
  );
  $: envelopesMap = new Map(envelopes.map(envelope => [envelope.id, envelope]));

  const fillsObj = new fromPairs(
    envelopes.map(envelope => [envelope.id, null])
  );

  $: unallocated = envelopes.find(
    envelope => envelope.name === '[Unallocated]'
  );

  $: calcFillAmount = envelope => {
    const envelopeWithBalance = {
      ...envelope,
      balance: $balancesStore[envelope.id],
    };
    return Math.round(
      Balances.calcAmountForPeriod(envelopeWithBalance)[$intervalStore]
    );
  };

  function setToFillAmount(envelope, interval, balance) {
    const fillAmount = calcFillAmount(envelope);
    return -balance + fillAmount;
  }
  function setToZero(envelope, balance) {
    return -balance;
  }

  $: fills = Object.entries(fillsObj).map(([envelopeId, fillType]) => {
    // If the user is filling an "other" amount
    if (typeof fillType === 'number') return [envelopeId, fillType * 100];

    const envelope = envelopesMap.get(envelopeId);
    switch (fillType) {
      case null:
        return [envelopeId, 0];
      case 'fill-with-amount':
        return [envelopeId, calcFillAmount(envelope)];
      case 'set-to-amount':
        return [
          envelopeId,
          setToFillAmount(envelope, $intervalStore, $balancesStore[envelopeId]),
        ];
      case 'set-to-zero':
        return [envelopeId, setToZero(envelope, $balancesStore[envelopeId])];
    }
  });

  $: fillsByAccount = new Map(fills);

  $: sumOfFills = fills
    .map(([, fillAmount]) => fillAmount)
    .reduce((acc, item) => acc + item, 0);

  function magicFill(balances) {
    envelopes.forEach(envelope => {
      // We don't want to override anything the user has already configured
      if (fillsObj[envelope.id] !== null) return;

      const balance = balances[envelope.id];
      if (balance < 0) {
        fillsObj[envelope.id] = 'set-to-amount';
      } else {
        fillsObj[envelope.id] = 'fill-with-amount';
      }
    });
  }

  async function handleSubmit() {
    const txnGroupId = shortid.generate();
    const txns = fills
      .map(([envelopeId, fillAmount]) => {
        const txn = {
          id: `transaction/${shortid.generate()}`,
          memo: '',
          date: formatDate(new Date()),
          amount: fillAmount,
          label: null,
          type: 'envelopeTransfer',
          txn_id: txnGroupId,
          from_id: unallocated.id,
          to_id: envelopeId,
        };
        return txn;
      })
      .filter(txn => txn.amount !== 0);

    await saveTransactions({transactionsStore}, dexie, txns);
    page('/home');
  }
</script>

<form class="content" on:submit|preventDefault={handleSubmit}>
  <div class="flex flex-wrap">
    <div>
      <button class="btn btn-primary" on:click|preventDefault={() => magicFill($balancesStore)}>Magic Fill</button>
      <p class="italic text-xs">Fills all envelopes. If an envelope is below zero, raises it to the fill amount.</p>
    </div>

    <input type="submit" value="Save Fills" class="btn btn-primary" />
  </div>

  <p class="sticky top-0 bg-white shadow-md p-3 mb-3">New [Unallocated] balance: {toDollars($balancesStore[unallocated.id] - sumOfFills)}</p>

  <select
    bind:value={$intervalStore}
    on:change={event => intervalStore.set(event.target.value)}
    class="border">
    <option value="weekly">Weekly</option>
    <option value="biweekly">Biweekly</option>
    <option value="bimonthly">Bimonthly</option>
    <option value="monthly">Monthly</option>
    <option value="annually">Annually</option>
  </select>

  {#each envelopes as envelope (envelope.id)}
    <div class="flex flex-wrap">
      <div style="flex-basis: 450px;">
        <Balance account={envelopesMap.get(envelope.id)} defaultDaysToRender={15} />
        <p class="text-xs p-3">{toDollars($balancesStore[envelope.id])} + {toDollars(fillsByAccount.get(envelope.id))} = {toDollars($balancesStore[envelope.id] + fillsByAccount.get(envelope.id))}</p>
      </div>
      <div>

        <label>
          <input
            type="radio"
            bind:group={fillsObj[envelope.id]}
            value="fill-with-amount" />
          Fill with {toDollars(calcFillAmount(envelope))} ({$intervalStore} amount)
        </label>
        <br />
        <label>
          <input
            type="radio"
            bind:group={fillsObj[envelope.id]}
            value="set-to-amount" />
          Raise/lower to {toDollars(calcFillAmount(envelope))} ({$intervalStore}
          amount)
        </label>
        <br />
        <label>
          <input
            type="radio"
            bind:group={fillsObj[envelope.id]}
            value="set-to-zero" />
          Set to 0.00
        </label>

        <br />

        <label>
          Other amount
          <input class="border" type="number" step="0.01" on:input={event => event.target.value ? fillsObj[envelope.id] = parseFloat(event.target.value) : fillsObj[envelope.id] = null} />
        </label>
      </div>
    </div>

    <hr />
  {/each}

  <input type="submit" value="Save Fills" class="btn btn-primary" />
</form>
