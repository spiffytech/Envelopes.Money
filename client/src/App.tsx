import axios from 'axios';
import checkOnline from 'is-online';
import * as jsCookie from 'js-cookie';
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
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [loginStateError, setLoginStateError] = useState<string | null>(null);
  useEffect(() => {
    async function watchLoginStatus(): Promise<void> {
      const onlineStatus = await checkOnline();
      setIsOnline(onlineStatus);
      if (!onlineStatus) return watchLoginStatus();

      try {
        const response = await axios.get(`${endpoint}/isAuthed`, {timeout: 5000});
        AuthStore.loggedIn = response.data.isAuthed;
        AuthStore.userId = response.data.userId;
        AuthStore.apiKey = response.data.apiKey;
        setLoginStateError(null);

        const sessionDurationStr = jsCookie.get('sessionAlive');
        // Sleep until our session expires instead of hammering the server with
        // useless checks to see if we're still logged in. (Logging out will
        // take care of setting the `loggedIn` flag.)
        if (sessionDurationStr) {
          const sessionDuration = parseInt(sessionDurationStr);
          await new Promise((resolve) => setTimeout(
            // setTimeout can only handle 32-bit numbers. A 2-week millisecond
            // expiration is bigger than that.
            resolve, Math.min(sessionDuration, 2147483647)
          ));
        }
      } catch (ex) {
        if (ex.response.status >= 500) {
          setLoginStateError('Error validating your logged-in state');
        }
        AuthStore.userId = null;
        AuthStore.apiKey = null;
        AuthStore.loggedIn = false;
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        watchLoginStatus();
      }
    }

    watchLoginStatus();
  }, []);

  if (isOnline === undefined) return <p>Checking online status...</p>
  if (isOnline === false) return <p>App cannot work offline</p>
  if (AuthStore.loggedIn === undefined) return <p>Checking if you're logged in</p>;
  if (loginStateError) return <p>{loginStateError}</p>;

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
