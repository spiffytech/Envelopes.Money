import {format} from 'date-fns';
import React from 'react';

import styles from './TxnGrouped.module.css';
import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function({txn, onClick}: {txn: CommonTypes.TxnGrouped, onClick: () => any}) {
  return (
    <div onClick={onClick} className={styles.txnGroupedOuter}>
      <div className={styles.txnGroupedDate}>{format(txn.date, 'MM/DD')}</div>
      <div className={styles.txnGroupedCenter}>
        <div className={styles.txnGroupedLabel}>
          {txn.label} {txn.memo ? <span title={txn.memo}>memo</span> : null}
        </div>

        <div className={styles.txnGroupedAccounts}>
          <span style={{whiteSpace: "nowrap"}}>{txn.from_name}</span>
          &nbsp;→&nbsp;
          <span className={styles.collapsable}>{txn.to_names}</span>
        </div>
      </div>
      <div className={styles.txnGroupedAmount}>{toDollars(txn.amount)}</div>
    </div>
  );
}
