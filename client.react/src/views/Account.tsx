import { useObserver } from "mobx-react-lite";
import React, { useContext } from "react";
import { Link, RouteComponentProps } from "react-router-dom";

import StoreContext from "../store";
import { toDollars } from "../lib/pennies";

export default function Account({
  match
}: RouteComponentProps<{ accountId: string }>) {
  const accountId = decodeURIComponent(match.params.accountId);
  const store = useContext(StoreContext);

  return useObserver(() => {
    if (!store.accounts[accountId]) return <p>Loading...</p>;

    const transactions = store.transactionsSorted.filter(
      transaction =>
        transaction.from_id === accountId || transaction.to_id === accountId
    );
    return (
      <div>
        <header>{store.accounts[accountId].name}</header>

        {transactions.map(txn => (
          <Link
            to={`/transaction/${encodeURIComponent(txn.txn_id)}`}
            style={{ display: "contents" }}
            key={txn.id}
          >
          <div
            className="flex justify-between p-3 rounded m-1 shadow-md bg-white"
          >
            <div className="mr-2">{txn.date}</div>
            <div className="text-left flex-1 min-w-0 mr-2">
              <div className="text-left font-bold">
                {txn.label ? (
                  <span>{txn.label}</span>
                ) : (
                  <span className="italic text-sm">No Label</span>
                )}
              </div>

              <div className="flex flex-1 text-xs italic">
                <span className="whitespace-no-wrap">
                  {store.accounts[txn.from_id].name}
                </span>
                &nbsp;→&nbsp;
                <span
                  style={{ textOverflow: "ellipsis" }}
                  className="whitespace-no-wrap overflow-hidden"
                >
                  {store.accounts[txn.to_id].name}
                </span>
              </div>
            </div>

            <div className="text-right">{toDollars(txn.amount)}</div>
          </div>
          </Link>
        ))}
      </div>
    );
  });
}
