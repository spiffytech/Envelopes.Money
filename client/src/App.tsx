import {observer} from 'mobx-react';
import {Link, Router} from '@reach/router';
import {RouteComponentProps} from '@reach/router';
import React from 'react';

import './App.css';
import Home from './components/Home';
import NewTxn from './components/NewBankTxn';
import LogIn from './components/LogIn';
import {AuthStore} from './store';

function Route404(props: RouteComponentProps) {
  return <p>404 not found!!1!</p>;
}

function App() {
  if (AuthStore.loggedIn) {
    return (
      <>
        <div>
          <Link to='/newTxn'>New Transaction</Link>
        </div>

        <Router>
          <Home path='/' />
          <NewTxn path='/editTxn' />
          <NewTxn path='/editTxn/:txnId' />
          <Route404 default />
        </Router>
      </>
    );
  } else {
    return (
      <Router>
        <LogIn path='/login' default />
      </Router>
    );
  }
}

export default observer(App);
