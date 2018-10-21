import {inject, observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';

@inject('store')
@observer
export default class Transactions extends React.Component<{store?: Store}> {
  public render() {
    return (
      <div className='container'>
        <table>
          <tbody>
            {this.props.store!.transactionsByDate.map((txn) =>(
              <tr key={txn.id}>
                <td>{txn.date.toJSON()}</td>
                <td>{txn.payee}</td>
                <td>{txn.from.name} ⇨ {txn.to.map((to) => to.bucket.name).join(', ')}</td>
                <td>{txn.memo}</td>
                <td>{txn.amount.dollars}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
