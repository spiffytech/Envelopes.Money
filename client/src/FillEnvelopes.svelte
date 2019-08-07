<script>
  import page from "page";
  import * as shortid from "shortid";

  import Balance from "./Balance.svelte";
  import * as Balances from "./lib/Balances";
  import MoneyInput from "./MoneyInput.svelte";
  import { toDollars } from "./lib/pennies";
  import { arrays as derivedStore} from "./stores/main";
  import * as Transactions from "./lib/Transactions";
  import { formatDate, guardCreds } from "./lib/utils";
  import {PouchTransactions} from './lib/pouch';

  const creds = guardCreds();

  const today = formatDate(new Date());
  let fills = $derivedStore.envelopes.map((envelope) => ({
      amount: 0,
      envelope: {...envelope, balance: $derivedStore.balancesByAccountByDay[envelope.id].balances[today]}
    }));
  $: sumOfFills = fills
    .map(fill => fill.amount)
    .reduce((acc, item) => acc + item, 0);
  $: unallocated = fills.find(fill => fill.envelope.name === "[Unallocated]");
  $: notUnallocated = fills.filter(
    fill => fill.envelope.name !== "[Unallocated]"
  );

  let interval = localStorage.getItem('fillInterval') || "monthly";
  $: c = fill =>
    Math.round(Balances.calcAmountForPeriod(fill.envelope)[interval]);

  function persistInterval() {
    localStorage.setItem('fillInterval', interval);
  }

  async function handleSubmit() {
    const txnId = shortid.generate();
    const txns = fills
      .map((fill, i) => {
        const txn = {
          id: `transaction/${shortid.generate()}`,
          memo: "",
          date: formatDate(new Date()),
          amount: fill.amount,
          label: null,
          type: "envelopeTransfer",
          txn_id: txnId,
          from_id: unallocated.envelope.id,
          to_id: fill.envelope.id
        };
        return txn;
      })
      .filter(txn => txn.amount !== 0);

    if (!window._env_.POUCH_ONLY) {
      await Transactions.saveTransactions(creds, txns);
    }
    if (window._env_.USE_POUCH) {
      const pouchTransactions = new PouchTransactions(creds.localDB);
      pouchTransactions.saveAll(txns);
    }
    page("/home");
  }
</script>

    <div class="flex justify-around content">
        <form
          on:submit|preventDefault={handleSubmit}
          class="bg-white p-4 rounded border border-2 border-grey-light m-4"
        >
            <p>Unallocated: {toDollars(unallocated.envelope.balance - sumOfFills)}</p>

            <select
                bind:value={interval}
                on:change={persistInterval}
                class="border"
            >
                <option value='weekly'>Weekly</option>
                <option value='biweekly'>Biweekly</option>
                <option value='bimonthly'>Bimonthly</option>
                <option value='monthly'>Monthly</option>
                <option value='annually'>Annually</option>
            </select>

            {#each notUnallocated as fill}
                <div class="flex justify-between bubble">
                    <div>
                        <div>
                            <Balance balance={$derivedStore.balancesByAccountByDay[fill.envelope.id]} defaultDaysToRender={15} />

                            <button
                                class="border btn btn-secondary"
                                on:click|preventDefault={
                                    () => fill.amount = -fill.envelope.balance + c(fill)}
                            >
                                Set to {toDollars(c(fill))}
                            </button>
                        </div>

                        <div>
                            <button
                                class="border btn btn-secondary"
                                on:click|preventDefault={() => fill.amount = c(fill)}
                            >
                                Fill with {toDollars(c(fill))}
                            </button>
                        </div>

                        <div>
                            <button
                                class="border btn btn-secondary"
                                on:click|preventDefault={() => fill.amount = -fill.envelope.balance}
                            >
                                Set to 0
                            </button>
                        </div>

                        <div>
                            <p>Old Balance: {toDollars(fill.envelope.balance)}</p>
                            <span>Fill:</span>
                            <MoneyInput
                              amount={fill.amount}
                              defaultType="credit"
                              on:change={({detail}) => fill.amount = detail}
                            />
                            <p>{fill.amount}</p>
                            <p>New Balance: {toDollars(fill.envelope.balance + fill.amount)}</p>
                        </div>
                    </div> 
                </div>
            {/each}

            <input type='submit' value='Fill!' class='btn btn-primary' />
        </form>
    </div>
