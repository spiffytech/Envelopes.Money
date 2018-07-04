import {action, observable, toJS} from 'mobx';
import {observer} from 'mobx-react';
import * as React from 'react';

import * as Txns from '../lib/txns';
import Store from '../store';

/* tslint:disable:jsx-no-lambda */

const setAttr = (txn: Txns.Txn, field: string) => action((event: any) => txn[field] = event.target.value);

const EditBankTxn = observer(({txn, onSubmit}: {txn: Txns.BankTxn, onSubmit: (event: any) => void}) => {

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="payee">Payee</label>
        <input id="payee" className="form-control" value={txn.payee} onChange={setAttr(txn, 'payee')} />
      </div>

      <input type="submit" className="btn btn-primary" value="Save Transaction" />
    </form>
  );
});

export default observer(function EditTxn({store, txn}: {store: typeof Store, txn: Txns.Txn}) {
  const txnO = observable(txn);
  const onSubmit = async (event: any) => {
    event.preventDefault();
    await store.upsertTxn(toJS(txnO))
    return store.showHome();
  };

  return <EditBankTxn txn={txnO as Txns.BankTxn} onSubmit={onSubmit} />
});
