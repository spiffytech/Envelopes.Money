import {action, observable, toJS} from 'mobx';
import {observer} from 'mobx-react';
import * as React from 'react';

import * as Txns from '../lib/txns';
import Store from '../store';

/* tslint:disable:jsx-no-lambda */

const setAttr = (txn: Txns.Txn, field: string) => action((event: any) => txn[field] = event.target.value);
const setAmount = (txn: Txns.Txn) => action((event: any) => txn.amount = Txns.dollarsToPennies(event.target.value));

@observer
class EditBankTxn extends React.Component<{txn: Txns.BankTxn, onSubmit: (txn: Txns.BankTxn) => (event: any) => void}> {
  @observable private txn = this.props.txn;

  public render() {
    const txn = this.txn;
    return (
      <form onSubmit={this.props.onSubmit(txn)}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" className="form-control" value={Txns.formatDate(txn.date)} onChange={setAttr(txn, 'date')} />
        </div>

        <div className="form-group">
          <label htmlFor="payee">Payee</label>
          <input id="payee" className="form-control" value={txn.payee} onChange={setAttr(txn, 'payee')} />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Payee</label>
          <input id="amount" className="form-control" value={Math.abs(Txns.penniesToDollars(txn.amount))} onChange={setAmount(txn)} />
        </div>

        <input type="submit" className="btn btn-primary" value="Save Transaction" />
      </form>
    );
  }
}

export default observer(function EditTxn({store, txn}: {store: typeof Store, txn: Txns.Txn}) {
  const onSubmit = (txnNew: Txns.BankTxn) => async (event: any) => {
    event.preventDefault();
    await store.upsertTxn(toJS(txnNew))
    return store.showHome();
  };

  return <EditBankTxn txn={txn as Txns.BankTxn} onSubmit={onSubmit} />
});
