import * as d3 from "d3";
import * as R from "ramda";
import React from "react";

import { AccountBalance } from "../store";
import { toDollars } from "../lib/pennies";
import { durations, formatDate } from "../lib/utils";
import { IAccount } from "../lib/types";

function calcDaysToRender(account: IAccount, defaultDaysToRender: number) {
  if (account.type === "envelope") {
    if (account.extra.interval === "total") {
      return defaultDaysToRender + 1;
    }
    return durations[account.extra.interval] + 1;
  }
  return defaultDaysToRender + 1;
}

function calcDaysInPeriod(
  periodStart: Date,
  days = [] as Date[],
  periodEnd = new Date()
): Date[] {
  const nextDate = new Date(periodStart.getTime() + 86400000);
  if (nextDate > periodEnd) return days;
  return calcDaysInPeriod(nextDate, [...days, nextDate], periodEnd);
}

export default function Balance({
  balance,
  defaultDaysToRender
}: {
  balance: AccountBalance;
  defaultDaysToRender: number;
}) {
  const daysToRender = calcDaysToRender(balance.account, defaultDaysToRender);
  const datesToRender = calcDaysInPeriod(
    new Date(new Date().getTime() - 86400000 * daysToRender)
  );
  const renderableDatapoints = datesToRender.map(
    date => (balance.balances[formatDate(date)] || 0) / 100
  );

  const currentDateStr = formatDate(new Date());
  const currentBalance = toDollars(balance.balances[currentDateStr]);
  const periodOverPeriod =
    (R.last(renderableDatapoints) || 0) - (R.head(renderableDatapoints) || 0);
  const xScale = d3
    .scaleLinear()
    .domain([0, renderableDatapoints.length])
    .range([0 + 10, 400 - 10]);
  const yScale = d3
    .scaleSqrt()
    .domain([
      Math.max(0, ...renderableDatapoints),
      Math.min(0, ...renderableDatapoints)
    ])
    // Add some margin to our scale so we have room to draw the dots
    .range([0 + 10, 100 - 10]);

  const circles = renderableDatapoints.map((data, i) => ({
    x: xScale(i),
    y: yScale(data),
    data,
    date: datesToRender[i]
  }));

  const d = d3
    .line<number>()
    .x((_item, i) => xScale(i))
    .y(item => yScale(item))(renderableDatapoints);

  const dZero = d3
    .line<number>()
    .x((_item, i) => xScale(i))
    .y(_item => yScale(0))(renderableDatapoints);

  return (
    <div
      className="item flex-grow p-3 border border-gray-100 shadow-md rounded-lg m-3 bg-white"
      style={{ minWidth: 0 }}
    >
      <div className="flex justify-between">
        <div>
          <div className="text-sm small-caps">{balance.account.name}</div>
          <div className="text-xl font-bold">{currentBalance}</div>
        </div>
        <div>
          <span className="p-2 border border-black rounded-lg">
            {periodOverPeriod >= 0 ? "🡅" : "🡇"} {periodOverPeriod.toFixed(2)}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 400 100">
        <path d={dZero!} fill="none" strokeWidth="2" stroke="black"></path>
        <path
          d={d!}
          fill="none"
          strokeWidth="2"
          className="stroke-current text-gray-500"
        ></path>
        {circles.map(circle => (
          <circle
            key={circle.x}
            cx={circle.x}
            cy={circle.y}
            r="3"
            color="purple"
          >
            <title>
              {circle.date.toLocaleDateString()} - {circle.data}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
