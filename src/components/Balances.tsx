import {observer} from 'mobx-react';
import * as React from 'react';
import * as Types from '../lib/types';
import * as utils from '../lib/utils';

export default observer(
  function Balances({accounts}: {accounts: Map<string, Types.Balance>}) {
    return (
      <table className="table">
        <tbody>
          {Array.from(accounts.values()).map((account) =>
            <tr key={account.name}>
              <th scope="row">{account.name}</th>
              <td>{utils.formatCurrency(account.balance)}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
);