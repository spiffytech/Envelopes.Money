import {Provider} from 'mobx-react';
import * as React from 'react';

import mkApollo from '../lib/apollo';
import Auth from '../lib/auth';
import Store from '../store';

import AccountBalances from './AccountBalances';
import CategoryBalances from './CategoryBalances';
import Transactions from './Transactions';


export default class LoggedIn extends React.Component<{store?: Store}> {
  public auth: Auth;
  public store: Store;

  public state = {
    tabList: [
      {name: 'Categories', component: CategoryBalances},
      {name: 'Accounts', component: AccountBalances},
    ],
    activeTab: 'Categories',
  };

  public componentWillMount() {
    this.auth = new Auth();
    const jwt = this.auth.getToken();
    if (!jwt) throw new Error('No JWT token stored in browser');
    const apollo = mkApollo(jwt);
    this.store = new Store(apollo);

    (window as any).auth = this.auth;
    (window as any).store = this.store;

    Promise.all([
      this.store.loadCategories(),
      this.store.loadAccounts(),
    ]).then(() => this.store.loadTxns());

    this.logOut = this.logOut.bind(this);
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
              <button className='button' onClick={this.logOut}>Log Out</button>
            </div>
          </nav>
          <section className='section columns'>
            <div className='container is-one-third'>
              <div className='tabs' style={{marginBottom: 0}}>
                <ul>
                  {this.state.tabList.map((tab) =>
                    <li 
                      key={tab.name}
                      className={tab.name === this.state.activeTab ? 'is-active' : ''}
                      onClick={() => this.setState({activeTab: tab.name})}
                    >
                      {tab.name}
                    </li>
                  )}
                </ul>
              </div>

              {this.state.tabList.map((tab) => {
                if (tab.name === this.state.activeTab) return <tab.component />;
                return null;
              })}
            </div>
            <div className='container is-two-thirds'>
              <Transactions />
            </div>
          </section>
        </>
      </Provider>
    );
  }

  private logOut() {
    this.auth.logout();
  }
}
