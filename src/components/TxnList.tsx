import * as dateFns from 'date-fns';
import {autorun} from 'mobx';
import {inject, observer} from 'mobx-react';
import * as React from 'react';
import * as Txns from '../lib/txns';
import * as utils from '../lib/utils';
import Store from '../store';

function formatDate(date: any) {
  return dateFns.format((date as any).toDate(), 'YYYY-MM-DD')
}

function BankTxn({txn}: {txn: Txns.BankTxn}) {
  return (
    <tr>
      <td>{formatDate(txn.date)}</td>
      <td>{txn.payee}</td>
      <td>
        {Object.entries(txn.categories).map(([category, amount]) =>
          <p key={`${txn._id}-${category}`}>{category}: {utils.formatCurrency(amount)}</p>
        )}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(txn.amount)}</td>
    </tr>
  );
}

function AccountTransfer({txn}: {txn: Txns.AccountTransfer}) {
  return (
    <tr>
      <td>{formatDate(txn.date)}</td>
      <td>{txn.from}</td>
      <td>
        {txn.to}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(txn.amount)}</td>
    </tr>
  );
}

function EnvelopeTransfer({txn}: {txn: Txns.EnvelopeTransfer}) {
  return (
    <tr>
      <td>{formatDate(txn.date)}</td>
      <td>{txn.from}</td>
      <td>
        {txn.to}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(txn.amount)}</td>
    </tr>
  );
}

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
                <th>Categories</th>
                <th>Memo</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {this.props.store!.visibleTxns.map((txn) =>
                txn.type === 'banktxn' ? <BankTxn key={txn._id} txn={txn} /> :
                txn.type === 'accountTransfer' ? <AccountTransfer key={txn._id} txn={txn} /> :
                txn.type === 'envelopeTransfer' ? <EnvelopeTransfer key={txn._id} txn={txn} /> :
                null
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