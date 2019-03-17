import React from 'react';

import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function({txn}: {txn: CommonTypes.TxnGrouped}) {
  const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const textAlignStyle: React.CSSProperties = {textAlign: 'left'};

  return (
    <tr>
      <td style={{whiteSpace: 'nowrap', ...textAlignStyle}}>{txn.date}</td>
      <td style={{textAlign: 'right'}}>{toDollars(txn.amount)}</td>
      <td style={{...ellipsisStyle, maxWidth: '250px', ...textAlignStyle}}>{txn.label}</td>
      <td style={{...textAlignStyle}}>{txn.from_name}</td>
      <td style={{...ellipsisStyle, ...textAlignStyle}}>{txn.to_names}</td>
      <td style={{maxWidth: '250px', ...textAlignStyle}}>{txn.memo}</td>
    </tr>
  );
}
