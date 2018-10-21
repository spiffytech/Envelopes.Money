import {inject, observer} from 'mobx-react';
import * as React from 'react';
// import {BrowserRouter as Router, Route, Link} from 'react-router-dom';

import Store from './store';

@inject('store')
@observer
class App extends React.Component<{store?: Store}> {
  public render() {
    return (
      <>
        <nav className='navbar' role='navigation' aria-label='main navigation'>
          <div className='navbar-brand'>
            <a className='navbar-item' href='/'>HackerBudget</a>
          </div>
        </nav>
        <section className='section'>
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
        </section>
      </>
    );
  }
}

export default App;
