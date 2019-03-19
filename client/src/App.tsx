import {Observer, observer} from 'mobx-react-lite';
import {Link, Router} from '@reach/router';
import {RouteComponentProps} from '@reach/router';
import React from 'react';

import './App.css';
import Home from './components/Home';
import EditAccount from './components/EditAccount';
import EditTxn from './components/EditTxn';
import FillEnvelopes from './components/FillEnvelopes';
import LogIn from './components/LogIn';
import {AuthStore, FlashStore} from './store';

function Route404(props: RouteComponentProps) {
  return <p>404 not found!!1!</p>;
}

function Flash() {
  return <Observer>{() => <div>{FlashStore.flash}</div>}</Observer>
}

function App() {
  return (
    <>
      {AuthStore.loggedIn ?
        (
          <>
            <div>
              <Link to='/'>Home</Link>
              <Link to='/editAccount'>New Account</Link>
              <Link to='/editTxn'>New Transaction</Link>
              <Link to='/fill'>Fill Envelopes</Link>
            </div>

            <Flash />

            <Router>
              <Home path='/' />
              <EditAccount path='/editAccount' />
              <EditAccount path='/editAccount/:accountId' />
              <EditTxn path='/editTxn' />
              <EditTxn path='/editTxn/:txnId' />
              <FillEnvelopes path='/fill' />
              <FillEnvelopes path='/fill/:txnId' />
              <Route404 default />
            </Router>
          </>
        )
          :
        (
          <>
            <Flash />
            <Router>
              <LogIn path='/login' default />
            </Router>
          </>
        )
      }
    </>
  );
}

export default observer(App);
