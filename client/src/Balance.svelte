<script>
  import { scaleLinear, scaleSqrt } from 'd3-scale';
  import Debug from 'debug';
  import { line } from 'd3-shape';
  import fromPairs from 'ramda/es/fromPairs';
  import head from 'ramda/es/head';
  import last from 'ramda/es/last';
  import { getContext, beforeUpdate } from 'svelte';

  import { toDollars } from './lib/pennies';
  import { durations, formatDate } from './lib/utils';

  const debug = Debug('Envelopes.Money:Balance.svelte');

  export let account;
  export let defaultDaysToRender;

  const balancesStore = getContext('balancesStore');
  const localDB = getContext('localDB');

  let datesToRender = [];
  let renderableDatapoints = [];

  async function generateGraphData(account, balances) {
    const dates = new Array(defaultDaysToRender).fill(null).map((_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      return date;
    });

    debug(
      'Loading daily balance changes from the DB for keys %o - %o',
      [account.id, formatDate(dates[dates.length - 1])],
      [account.id, formatDate(dates[0])]
    );
    const { rows: balanceChanges } = await localDB.query(
      'balances-by-date/balances',
      {
        group: true,
        reduce: true,
        startkey: [account.id, formatDate(dates[dates.length - 1])],
        endkey: [account.id, formatDate(dates[0])],
      }
    );
    debug('Loaded with %o, %o', balances, balanceChanges);
    const balanceChangesByDate = fromPairs(
      balanceChanges.map(change => [change.key[1], change.value])
    );

    const balanceByDate = dates.reduce((acc, date) => {
      // Calculate today's ending balance by undoing tomorrow's transactions
      const tomorrow = new Date(new Date(date).setDate(date.getDate() + 1));
      const tomorrowsBalance = acc[0] || balances[account.id] || 0;
      const tomorrowsBalanceChange =
        balanceChangesByDate[formatDate(tomorrow)] || 0;
      return [tomorrowsBalance - tomorrowsBalanceChange, ...acc];
    }, []);
    datesToRender = dates.reverse();
    renderableDatapoints = balanceByDate.map(balance => balance);
  }

  $: generateGraphData(account, $balancesStore);

  $: periodOverPeriod =
    (last(renderableDatapoints) || 0) - (head(renderableDatapoints) || 0);
  $: xScale = scaleLinear()
    .domain([0, renderableDatapoints.length])
    .range([0 + 10, 400 - 10]);
  $: yScale = scaleSqrt()
    .domain([
      Math.max(0, ...renderableDatapoints),
      Math.min(0, ...renderableDatapoints),
    ])
    // Add some margin to our scale so we have room to draw the dots
    .range([0 + 10, 100 - 10]);

  $: circles = renderableDatapoints.map((data, i) => ({
    x: xScale(i),
    y: yScale(data),
    data,
    date: datesToRender[i],
  }));

  $: d = line()
    .x((_item, i) => xScale(i))
    .y(item => yScale(item))(renderableDatapoints);

  $: dZero = line()
    .x((_item, i) => xScale(i))
    .y(() => yScale(0))(renderableDatapoints);
</script>

<div
  class="item flex-grow p-3 border border-gray-100 shadow-md rounded-lg m-3
  bg-white"
  style="min-width: 0"
  data-cy="balance">
  <div class="flex justify-between">
    <div>
      <div class="text-sm small-caps" data-cy="account-name">
        {account.name}
      </div>
      <div class="text-xl font-bold" data-cy="account-balance">
        {toDollars($balancesStore[account.id])}
      </div>
    </div>
    <div>
      <span class="p-2 border border-black rounded-lg">
        {periodOverPeriod >= 0 ? '⬆️' : '⬇️'} {toDollars(periodOverPeriod)}
      </span>
    </div>
  </div>
  <svg viewBox="0 0 400 100">
    <path d={dZero} fill="none" strokeWidth="2" stroke="black" />
    <path
      {d}
      fill="none"
      strokeWidth="2"
      class="stroke-current text-gray-500" />
    {#each circles as circle}
      <circle cx={circle.x} cy={circle.y} r="3" color="purple">
        <title>
          {circle.date.toLocaleDateString()}: {toDollars(circle.data)}
        </title>
      </circle>
    {/each}
  </svg>
</div>
