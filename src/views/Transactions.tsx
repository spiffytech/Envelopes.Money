import { inject, observer } from 'mobx-react';
import * as React from 'react';

import * as utils from '../lib/utils';
import Store from '../store';

@inject('store')
@observer
export default class Transactions extends React.Component<{ store?: Store }> {
  public render() {
    return (
      <table className='table is-fullwidth'>
        <tbody>
          {this.props.store!.transactionsByDate.map((txn) => (
            <tr key={txn.id}>
              <td>
                <div className='is-flex' style={{justifyContent: 'space-between'}}>
                  <div className='is-flex'>
                    <div className='has-text-weight-semibold'>{txn.payee}</div>
                    {txn.payee && txn.memo ? <span>&nbsp;•&nbsp;</span> : null}
                    <div className='has-text-weight-semibold is-size-7' style={{display: 'flex', alignItems: 'center'}}>
                      {txn.memo}
                    </div>
                  </div>
                  <div className='is-flex is-size-7'>
                    <div>{utils.formatDate(txn.date)}</div>
                  </div>
                </div>
                <div className='is-flex' style={{justifyContent: 'space-between'}}>
                  <div>{utils.formatCurrency(txn.amount.dollars)}</div>
                  <div className='is-size-7'>{txn.from.name} ⇨ {txn.to.map((to) => to.bucket.name).join(', ')}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
