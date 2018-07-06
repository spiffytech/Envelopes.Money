import {action, autorun, observable, runInAction, toJS} from 'mobx';
import {observer} from 'mobx-react';
import * as React from 'react';

import * as Txns from '../lib/txns';
import Store from '../store';

/* tslint:disable:jsx-no-lambda */
/* tslint:disable:jsx-no-bind */
/* tslint:disable:no-console */

const setAttr = (txn: Txns.Txn, field: string) => action((event: any) => txn[field] = event.target.value);

const penniesOnChange = action((isDebit: boolean, setValue: (p: Txns.Pennies) => void) => {
  return (event: any) => {
    const newAmount = Txns.dollarsToPennies(event.target.value as Txns.Dollars);
    runInAction(() =>
      setValue(isDebit ? newAmount * -1 as Txns.Pennies: newAmount)
    );
    console.log(newAmount, event.target.value);
  }
});

const PenniesEditor = observer((
  {getValue, setValue, isDebit}:
  {getValue: () => Txns.Pennies, isDebit: boolean, setValue: (p: Txns.Pennies) => void}
) => {
  return <input
    type="number"
    step="0.01"
    value={Txns.penniesToDollars(Math.abs(getValue()) as Txns.Pennies)}
    onChange={penniesOnChange(isDebit, setValue)}
  />
});

interface Props  {txn: Txns.BankTxn, onSubmit: (txn: Txns.BankTxn) => (event: any) => void}
@observer
class EditBankTxn extends React.Component<Props> {
  @observable private txn = this.props.txn;
  @observable private absDollars: Txns.Dollars = Txns.penniesToDollars(Math.abs(this.props.txn.amount) as Txns.Pennies);
  @observable private isDebit = this.props.txn.amount < 0;

  constructor(props: Props) {
    super(props);

    autorun(() => {
      const signedAmount = this.isDebit ? this.absDollars * -1 as Txns.Dollars: this.absDollars;
      runInAction(() => this.txn.amount = Txns.dollarsToPennies(signedAmount));
    });


    autorun(() =>
      console.log(JSON.stringify(this.txn))
    );
  }

  public render() {
    const txn = this.txn;
    return (
      <form onSubmit={this.props.onSubmit(txn)}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            className="form-control"
            value={Txns.formatDate(txn.date)}
            onChange={setAttr(txn, 'date')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="payee">Payee</label>
          <input
            id="payee"
            className="form-control"
            value={txn.payee}
            onChange={setAttr(txn, 'payee')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <PenniesEditor
            getValue={() => txn.amount}
            setValue={(amount: Txns.Pennies) => txn.amount = amount}
            isDebit={this.isDebit}
          />

          <select className="custom-select" onChange={this.setCreditDebit.bind(this)}>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {Object.entries(this.txn.categories).map(([name, value]) =>
          <div className="form-group" key={'category-' + name}>
            <label htmlFor={'category-' + name}>{name}</label>
            <PenniesEditor
              getValue={() => txn.categories[name]}
              setValue={(amount: Txns.Pennies) => txn.categories[name] = amount}
              isDebit={this.isDebit}
            />
          </div>
        )}

        <input type="submit" className="btn btn-primary" value="Save Transaction" />
      </form>
    );
  }

  @action
  private setCreditDebit(event: any) {
    this.isDebit = event.target.value === 'debit';
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
