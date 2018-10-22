import { inject, observer } from 'mobx-react';
import * as React from 'react';

import Amount from '../lib/Amount';
import Store from '../store';

@inject('store')
@observer
export default class Transactions extends React.Component<{ store?: Store }> {
  public render() {
    return (
      <table>
        <tbody>
          <tr>
            <td className='list-item' >
              <p className='has-text-weight-semibold'>Total</p>
              <p className='is-size-4 has-text-weight-semibold'>
                {Amount.Pennies(
                    this.props.store!.accountBalances.reduce((acc, {balance}) => acc + balance.pennies, 0)
                ).dollars}
              </p>
            </td>
          </tr>

          {this.props.store!.accountBalances.map(({ account, balance }) =>
            <tr key={account.id}>
              <td>
                <div className='list-item'>
                  <p className='is-size-6 has-text-weight-semibold'>{account.name}</p>
                  <p className='is-size-6 has-text-weight-semibold'>{balance.dollars}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
    return JSON.stringify(this.props.store!.categoryBalances);
  }
}
