import axios from 'axios';
import {Observer, observer} from 'mobx-react-lite';
import {BrowserRouter as Router, Route, Link, Redirect, Switch} from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import './App.css';
import Home from './components/Home';
import EditAccount from './components/EditAccount';
import EditTxn from './components/EditTxn';
import FillEnvelopes from './components/FillEnvelopes';
import LogIn from './components/LogIn';
import {AuthStore, FlashStore} from './store';
import {endpoint} from './lib/config';

function Route404() {
  return <p>404 not found!!1!</p>;
}

function Flash() {
  return <Observer>{() => <div style={{gridArea: 'flash'}}>{FlashStore.flash}</div>}</Observer>
}

function App() {
  const [loginStateKnown, setLoginStateKnown] = useState(false);
  const [loginStateError, setLoginStateError] = useState<string | null>(null);
  useEffect(() => {
    async function watchLoginStatus() {
      try {
        const response = await axios.get(`${endpoint}/isAuthed`, {timeout: 5000});
        AuthStore.loggedIn = response.data.isAuthed;
        AuthStore.userId = response.data.userId;
        AuthStore.apiKey = response.data.apiKey;
        setLoginStateError(null);
      } catch (ex) {
        if (ex.response.status >= 500) {
          setLoginStateError('Error validating your logged-in state');
        }
        AuthStore.userId = null;
        AuthStore.apiKey = null;
        AuthStore.loggedIn = false;
      } finally {
        if (!loginStateKnown) setLoginStateKnown(true);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        watchLoginStatus();
      }
    }

    watchLoginStatus();
  }, []);

  if (loginStateError) return <p>{loginStateError}</p>;
  if (!loginStateKnown) return <p>Checking if you're logged in</p>;

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
