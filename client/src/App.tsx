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
      <div className='stripe'></div>
      {AuthStore.loggedIn ?
        (
          <>
            <div style={{backgroundColor: 'white', border: '2px solid #e1e1e1', display: 'flex', justifyContent: 'space-between'}}>
              <Link to='/' className='linkBtn title'>HackerBudget</Link>
              <div>
                <Link to='/editTxn' className='linkBtn primary'>New Transaction</Link>
                <Link to='/editAccount' className='linkBtn secondary'>New Account</Link>
                <Link to='/fill' className='linkBtn secondary'>Fill Envelopes</Link>
              </div>
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
