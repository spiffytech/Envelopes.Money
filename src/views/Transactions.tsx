import {inject, observer} from 'mobx-react';
import * as React from 'react';

import * as utils from '../lib/utils';
import Store from '../store';

@inject('store')
@observer
export default class Transactions extends React.Component<{store?: Store}> {
  public render() {
    return (
      <table className='table is-fullwidth'>
        <tbody>
          {this.props.store!.transactionsByDate.map((txn) =>(
            <tr key={txn.id}>
              <td style={{whiteSpace: 'nowrap'}}>{utils.formatDate(txn.date)}</td>
              <td>{txn.payee}</td>
              <td>{txn.from.name} ⇨ {txn.to.map((to) => to.bucket.name).join(', ')}</td>
              <td>{txn.memo}</td>
              <td>{utils.formatCurrency(txn.amount.dollars)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
