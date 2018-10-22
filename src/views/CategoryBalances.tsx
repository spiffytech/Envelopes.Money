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
                    this.props.store!.categoryBalances.reduce((acc, {balance}) => acc + balance.pennies, 0)
                ).dollars}
              </p>
            </td>
          </tr>

          {this.props.store!.categoryBalances.map(({ category, balance }) =>
            <tr key={category.id}>
              <td>
                <div className='list-item'>
                  <p className='is-size-6 has-text-weight-semibold'>{category.name}</p>
                  <p className='is-size-6 has-text-weight-semibold'>{balance.dollars}</p>
                </div>

                <div className='list-item'>
                  <progress
                    className={`progress is-small ${balance.pennies < 0 ? 'is-danger' : 'is-success'}`}
                    value={Math.abs(balance.pennies)}
                    max={category.target.pennies}
                    style={{ width: '80%', marginBottom: 0 }}
                  />
                </div>

                <span className='is-size-7'>{category.target.dollars}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
    return JSON.stringify(this.props.store!.categoryBalances);
  }
}
