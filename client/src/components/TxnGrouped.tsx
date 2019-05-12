import {format} from 'date-fns';
import React from 'react';

import * as CommonTypes from '../../../common/lib/types';
import {toDollars} from '../lib/pennies';

export default function({txn, onClick}: {txn: CommonTypes.TxnGrouped, onClick: () => any}) {
  return (
    <div onClick={onClick} className='flex justify-between p-3 border border-grey-light rounded mb-1'>
      <div className='mr-2'>{format(txn.date, 'MM/DD')}</div>
      <div className='text-left flex-1 min-w-0 mr-2'>
        <div className='text-left font-bold'>
          {txn.label} {txn.memo ? <span title={txn.memo} role='img' aria-label='memo'>📄</span> : null}
        </div>

        <div className='flex flex-1 text-xs italic'>
          <span className='whitespace-no-wrap'>{txn.from_name}</span>
          &nbsp;→&nbsp;
          <span
            style={{textOverflow: 'ellipsis'}}
            className='whitespace-no-wrap overflow-hidden'
          >
            {txn.to_names}
          </span>
        </div>
      </div>
      <div className='text-right'>{toDollars(txn.amount)}</div>
    </div>
  );
}
