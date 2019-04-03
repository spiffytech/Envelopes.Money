import {Observer, observer} from 'mobx-react-lite';
import {BrowserRouter as Router, Route, Link, Switch} from 'react-router-dom';
import React from 'react';

import './App.css';
import Home from './components/Home';
import EditAccount from './components/EditAccount';
import EditTxn from './components/EditTxn';
import FillEnvelopes from './components/FillEnvelopes';
import LogIn from './components/LogIn';
import {AuthStore, FlashStore} from './store';
import { Redirect } from '@reach/router';

function Route404() {
  return <p>404 not found!!1!</p>;
}

function Flash() {
  return <Observer>{() => <div style={{gridArea: 'flash'}}>{FlashStore.flash}</div>}</Observer>
}

function App() {
  return (
    <div className='appGrid'>
      <div className='stripe'></div>
      {AuthStore.loggedIn ?
        (
          <>
            <Router>
              <div className='appNav'>
                <Link to='/' className='linkBtn title'>HackerBudget</Link>
                <div className='navRight'>
                  <Link to='/editTxn' className='linkBtn primary'>New Transaction</Link>
                  <Link to='/editAccount' className='linkBtn secondary'>New Account</Link>
                  <Link to='/fill' className='linkBtn secondary'>Fill Envelopes</Link>
                </div>
              </div>

              <Flash />

              <Switch>
                <Route path='/editAccount/:accountId' component={EditAccount} />
                <Route path='/editAccount' component={EditAccount} />
                <Route path='/editTxn/:txnId' component={EditTxn} />
                <Route path='/editTxn' component={EditTxn} />
                <Route path='/fill/:txnId' component={FillEnvelopes} />
                <Route path='/fill' component={FillEnvelopes} />
                <Route path='/' component={Home} />
                <Route component={Route404} />
              </Switch>
            </Router>
          </>
        )
          :
        (
          <>
            <Flash />
            <Router>
              <Switch>
                <Route path='/login' component={LogIn} />
                <Route render={() => <Redirect to='/login' />}></Route>
              </Switch>
            </Router>
          </>
        )
      }
    </div>
  );
}

export default observer(App);
