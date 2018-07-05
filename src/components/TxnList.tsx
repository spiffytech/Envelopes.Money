import {observer} from 'mobx-react';
import * as React from 'react';
import * as Txns from '../lib/txns';
import * as utils from '../lib/utils';
import Store from '../store';

const TxnListNavComponent: React.StatelessComponent<{store?: typeof Store}> = ({store}) => {
  return (
    <nav aria-label="Recent transactions">
      <ul className="pagination">
        <li className="page-item">
          <button
            className="page-link btn"
            disabled={store!.visibleIsFirstPage}
            /* tslint:disable-next-line */
            onClick={() => store!.loadTxnsPrevPage()}
          >
            Previous
          </button>
        </li>

        <li className="page-item">
          <button
            className="page-link btn"
            disabled={store!.visibleIsLastPage}
            /* tslint:disable-next-line */
            onClick={() => store!.loadTxnsNextPage()}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
const TxnListNav = observer(TxnListNavComponent);


function BankTxn({txn}: {txn: Txns.BankTxn}) {
  return (
    <>
      <td>{Txns.formatDate(txn.date)}</td>
      <td>{txn.payee}</td>
      <td>
        {Object.entries(txn.categories).map(([category, amount]) =>
          <p key={`${txn._id}-${category}`}>{category}: {utils.formatCurrency(Txns.penniesToDollars(amount))}</p>
        )}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(Txns.penniesToDollars(txn.amount))}</td>
    </>
  );
}

function AccountTransfer({txn}: {txn: Txns.AccountTransfer}) {
  return (
    <>
      <td>{Txns.formatDate(txn.date)}</td>
      <td>{txn.from}</td>
      <td>
        {txn.to}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(Txns.penniesToDollars(txn.amount))}</td>
    </>
  );
}

function EnvelopeTransfer({txn}: {txn: Txns.EnvelopeTransfer}) {
  return (
    <>
      <td>{Txns.formatDate(txn.date)}</td>
      <td>{txn.from}</td>
      <td>
        {txn.to}
      </td>

      <td>{txn.memo}</td>

      <td>{utils.formatCurrency(Txns.penniesToDollars(txn.amount))}</td>
    </>
  );
}

const initialState = { docs: [] };

interface Props {store: typeof Store}

@observer
export default class TxnList extends React.Component<Props, typeof initialState> {
  public readonly state = initialState;

  public render() {
    return (
      /* tslint:disable:jsx-no-lambda */
      <div>
        <TxnListNav store={this.props.store} />

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
              {this.props.store!.visibleTxns.map((txn) => <tr key={txn._id} onClick={this.props.store.showEditTxn.bind(this.props.store, txn._id)}>
                {
                  txn.type === 'banktxn' ? <BankTxn key={txn._id} txn={txn} /> :
                  txn.type === 'accountTransfer' ? <AccountTransfer key={txn._id} txn={txn} /> :
                  txn.type === 'envelopeTransfer' ? <EnvelopeTransfer key={txn._id} txn={txn} /> :
                  null
                }
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TxnListNav store={this.props.store} />
      </div>
    );
  }
}
