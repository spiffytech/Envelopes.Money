import {Provider} from 'mobx-react';
import * as React from 'react';

import mkApollo from '../lib/apollo';
import Auth from '../lib/auth';
import Store from '../store';

import Transactions from './Transactions';

export default class LoggedIn extends React.Component<{store?: Store}> {
  public auth: Auth;
  public store: Store;
  public componentWillMount() {
    this.auth = new Auth();
    const jwt = this.auth.getToken();
    if (!jwt) throw new Error('No JWT token stored in browser');
    const apollo = mkApollo(jwt);
    this.store = new Store(apollo);

    (window as any).auth = this.auth;
    (window as any).store = this.store;

    this.store.loadTxns();
  }

  public render() {
    return (
      <Provider store={this.store}>
        <>
          <nav className='navbar' role='navigation' aria-label='main navigation'>
            <div className='navbar-brand'>
              <a className='navbar-item' href='/'>HackerBudget</a>
            </div>

            <div className='navbar-start' />
            <div className='navbar-end'>
              <button className='button' onClick={() => this.logOut()}>Log Out</button>
            </div>
          </nav>
          <section className='section'>
            <Transactions />
          </section>
        </>
      </Provider>
    );
  }

  private logOut() {
    this.auth.logout();
  }
}
