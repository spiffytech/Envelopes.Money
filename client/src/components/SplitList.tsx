import React from 'react';

import * as Balances from '../lib/Balances';
import * as ITransactions from '../lib/ITransactions';
import Split from './Split';

export default function SplitList(
  {txns, to}:
  {
    txns: (ITransactions.EmptyTransaction | ITransactions.T)[],
    to: Balances.T[],
  }
) {
  return (
    <>
      {txns.map((txn, i) =>
        <Split
          key={txn.id}
          txn={txn}
          to={to}
        />
      )}
    </>
  );
}
