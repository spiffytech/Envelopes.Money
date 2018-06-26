import * as dateFns from 'date-fns';
import {autorun} from 'mobx';
import {inject, observer} from 'mobx-react';
import * as React from 'react';
import * as utils from '../lib/utils';
import Store from '../store';

const initialState = { docs: [] };

interface Props {store?: typeof Store}

@inject((stores) => ({store: (stores as any).store as typeof Store}))
@observer
export default class TxnList extends React.Component<Props, typeof initialState> {
  public readonly state = initialState;

  public componentDidMount() {
    /* tslint:disable-next-line */
    console.log('Running didMount')
    autorun(() => {
      if (this.props.store!.db) this.props.store!.loadTxnsNextPage();
    })
  }

  public render() {
    return (
      /* tslint:disable:jsx-no-lambda */
      <div>
        <nav aria-label="Recent transactions">
          <ul className="pagination">
            { this.props.store!.visibleTxnsFirst ?
              <li className="page-item">
                <button className="page-link" onClick={() => this.props.store!.loadTxnsPrevPage()}>
                  Previous
                </button>
              </li>
              : null
            }

            { this.props.store!.visibleTxnsLast ?
            <li className="page-item">
              <button className="page-link" onClick={() => this.props.store!.loadTxnsNextPage()}>
                Next
              </button>
            </li>
            : null
            }
          </ul>
        </nav>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Accounts</th>
              </tr>
            </thead>
            <tbody>
              {this.props.store!.visibleTxns.map((txn) =>
                <tr key={txn.id}>
                  <td>{dateFns.format((txn.date as any).toDate(), 'YYYY-MM-DD')}</td>
                  <td>{txn.payee}</td>
                  <td>
                    {Object.entries(txn.items).map(([account, amount]) =>
                      <p key={`${txn.id}-${account}`}>{account}: {utils.formatCurrency(amount)}</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav aria-label="Recent transactions">
          <ul className="pagination">
            <li className="page-item">
              <button className="page-link" onClick={() => this.props.store!.loadTxnsPrevPage()}>
                Previous
              </button>
            </li>

            <li className="page-item">
              <button className="page-link" onClick={() => this.props.store!.loadTxnsNextPage()}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}