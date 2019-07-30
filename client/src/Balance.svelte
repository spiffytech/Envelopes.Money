<script>
  import {scaleLinear, scaleSqrt} from 'd3-scale';
  import {line} from 'd3-shape';
  import head from 'ramda/es/head'
  import last from 'ramda/es/last';

  import {toDollars} from './lib/pennies';
  import {durations, formatDate} from './lib/utils';

  export let balance;
  export let defaultDaysToRender;

function calcDaysInPeriod(
  periodStart,
  days = [],
  periodEnd = new Date()
) {
  const nextDate = new Date(periodStart.getTime() + 86400000);
  if (nextDate > periodEnd) return days;
  return calcDaysInPeriod(nextDate, [...days, nextDate], periodEnd);
}

  $: datesToRender = calcDaysInPeriod(
    new Date(new Date().getTime() - 86400000 * defaultDaysToRender)
  );
  $: renderableDatapoints = datesToRender.map(
    date => (balance.balances[formatDate(date)] || 0) / 100
  );

  const currentDateStr = formatDate(new Date());
  $: currentBalance = toDollars(balance.balances[currentDateStr]);
  $: periodOverPeriod =
    (last(renderableDatapoints) || 0) - (head(renderableDatapoints) || 0);
  $: xScale = 
    scaleLinear()
    .domain([0, renderableDatapoints.length])
    .range([0 + 10, 400 - 10]);
  $: yScale =
    scaleSqrt()
    .domain([
      Math.max(0, ...renderableDatapoints),
      Math.min(0, ...renderableDatapoints)
    ])
    // Add some margin to our scale so we have room to draw the dots
    .range([0 + 10, 100 - 10]);

  $: circles = renderableDatapoints.map((data, i) => ({
    x: xScale(i),
    y: yScale(data),
    data,
    date: datesToRender[i]
  }));

  $: d =
    line()
    .x((_item, i) => xScale(i))
    .y(item => yScale(item))(renderableDatapoints);

  $: dZero =
    line()
    .x((_item, i) => xScale(i))
    .y(() => yScale(0))(renderableDatapoints);
</script>

    <div
      class="item flex-grow p-3 border border-gray-100 shadow-md rounded-lg m-3 bg-white"
      style="min-width: 0"
      data-cy="balance"
    >
      <div class="flex justify-between">
        <div>
          <div class="text-sm small-caps" data-cy="account-name">{balance.account.name}</div>
          <div class="text-xl font-bold" data-cy="account-balance">{currentBalance}</div>
        </div>
        <div>
          <span class="p-2 border border-black rounded-lg">
            {periodOverPeriod >= 0 ? "🡅" : "🡇"} {periodOverPeriod.toFixed(2)}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 400 100">
        <path d={dZero} fill="none" strokeWidth="2" stroke="black"></path>
        <path
          d={d}
          fill="none"
          strokeWidth="2"
          class="stroke-current text-gray-500"
        ></path>
        {#each circles as circle}
          <circle
            cx={circle.x}
            cy={circle.y}
            r="3"
            color="purple"
          >
            <title>
              {circle.date.toLocaleDateString()} - {circle.data}
            </title>
          </circle>
        {/each}
      </svg>
    </div>
