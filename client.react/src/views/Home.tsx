import { Observer } from "mobx-react";
import { useLocalStore } from "mobx-react-lite";
import * as R from "ramda";
import React, { useContext } from "react";
import { formatDate } from "../lib/utils";
import { toDollars } from "../lib/pennies";

import StoreContext, { AccountBalance } from "../store";
import Balance from "../components/Balance";

const sortFns = {
  name: (a: AccountBalance, b: AccountBalance) =>
    a.account.name < b.account.name ? -1 : 1,
  balance: (a: AccountBalance, b: AccountBalance) => {
    const currentDateStr = formatDate(new Date());
    return a.balances[currentDateStr] < b.balances[currentDateStr] ? -1 : 1;
  }
  /*
  'period-over-period': (a, b) => {
    const datesToRender = calcDaysInPeriod(
      new Date(new Date().getTime() - 86400000 * this.daysToRender)
    );
    const amountsArrA = datesToRender.map(
      date => a.balances[tinydate('{YYYY}-{MM}-{DD}')(date)] || 0
    );
    const diffA = amountsArrA[amountsArrA.length - 1] - amountsArrA[0];

    const amountsArrB = datesToRender.map(
      date => b.balances[tinydate('{YYYY}-{MM}-{DD}')(date)] || 0
    );
    const diffB = amountsArrB[amountsArrB.length - 1] - amountsArrB[0];

    console.log(diffA, diffB);
    return diffA < diffB ? -1 : 1;
  }
   */
};

export default function Home() {
  const store = useContext(StoreContext);
  const localStore = useLocalStore(() => ({
    sortBy: 'name' as keyof typeof sortFns,
    sortTag: null as string | null,
    showAccounts: false as boolean,
  }));

  console.log(store.transactions);
  return (
    <Observer>
      {() => {
        const sortFn = sortFns[localStore.sortBy];
        const accountBalances = store.accountBalances.slice().sort(sortFn);
        const envelopeBalances = store.envelopeBalances.slice().sort(sortFn);
        const allTags: string[] = R.uniq(
          R.chain(
            envelope => Object.keys(envelope.account.tags),
            envelopeBalances
          ).sort()
        );

        const envelopesByTag: { [tag: string]: AccountBalance[] } = R.groupBy(
          envelope => (localStore.sortTag ? envelope.account.tags[localStore.sortTag] : ""),
          envelopeBalances
        );

        const envelopeTagValues: string[] = Object.keys(envelopesByTag).sort();

        const totalBalancesByTag = R.fromPairs(
          Object.entries(envelopesByTag).map(([tag, envelopeBalances]) => {
            const currentDateStr = formatDate(new Date());
            return [
              tag,
              envelopeBalances
                .map(({ balances }) => balances[currentDateStr])
                .reduce(
                  (tagBalance, envelopeBalance) => tagBalance + envelopeBalance,
                  0
                )
            ];
          })
        );

        return (
          <div className="m-3">
            <div className="shadow-md p-3 rounded-lg mb-3 b-white max-w-sm">
              Sort by:
              <select onChange={(event) => localStore.sortBy = event.target.value as keyof typeof sortFns}>
                <option value="name">Name</option>
                <option value="balance">Balance</option>
              </select>
            </div>

            <div className="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
              <header className="font-bold text-lg small-caps cursor-pointer" onClick={() => localStore.showAccounts = !localStore.showAccounts}>
                <span>›</span> Accounts
              </header>
            </div>

            {localStore.showAccounts ? (
              <div className="flex flex-wrap -m-3">
                {accountBalances.map(balance => (
                  <Balance balance={balance} defaultDaysToRender={15} key={balance.account.id} />
                ))}
              </div>
            ) : null}

            <div className="shadow-md p-3 rounded-lg mb-3 bg-white max-w-sm">
              <header className="font-bold text-lg small-caps cursor-pointer">
                Envelopes
              </header>
              Group by:
              <select onChange={(event) => localStore.sortTag = event.target.value}>
                <option value={"null"}>No Tag</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {envelopeTagValues.map(tagValue => (
              <div key={tagValue}>
                <header className="small-caps">
                  {localStore.sortTag || "No tag selected"}:
                  <span className="font-bold small-caps">
                    {tagValue === "" ? "No Value" : tagValue}
                  </span>
                </header>
                <div>
                  Total balance: {toDollars(totalBalancesByTag[tagValue])}
                </div>
                <div className="flex flex-wrap -m-3">
                  {envelopesByTag[tagValue].map(balance => (
                    <Balance
                      balance={balance}
                      defaultDaysToRender={15}
                      key={balance.account.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }}
    </Observer>
  );
}
