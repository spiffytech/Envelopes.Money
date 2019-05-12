import checkOnline from 'is-online';
import * as jsCookie from 'js-cookie';
import { Observer, observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import './App.css';
import Home from './components/Home';
import EditAccount from './components/EditAccount';
import EditTxn from './components/EditTxn';
import FillEnvelopes from './components/FillEnvelopes';
import LogIn from './components/LogIn';
import { AuthStore, FlashStore } from './store';

function Route404() {
  return <p>404 not found!!1!</p>;
}

function Flash() {
  return <Observer>{() => <div style={{ gridArea: 'flash' }}>{FlashStore.flash}</div>}</Observer>
}

function App() {
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    async function watchOnlineStatus() {
      const onlineStatus = await checkOnline();
      setIsOnline(onlineStatus);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      watchOnlineStatus();
    }
    watchOnlineStatus();
  }, []);

  useEffect(() => {
    async function watchLoginStatus(): Promise<void> {
      const sessionDurationStr = jsCookie.get('sessionAlive');
      // Sleep until our session expires instead of hammering the server with
      // useless checks to see if we're still logged in. (Logging out will
      // take care of setting the `loggedIn` flag.)
      if (sessionDurationStr) {
        const sessionDuration = parseInt(sessionDurationStr);
        await new Promise((resolve) => setTimeout(
          resolve,
          // setTimeout can only handle 32-bit numbers. A 2-week millisecond
          // expiration is bigger than that.
          Math.min(sessionDuration, 2147483647)
        ));
      } else {
        AuthStore.loggedIn = false;
        AuthStore.userId = null;
        AuthStore.apiKey = null;
      }
    }

    watchLoginStatus();
  }, []);

  if (isOnline === undefined) return <p>Checking online status...</p>
  if (!isOnline) return <p>App cannot work offline</p>

  return (
    <div className='appGrid'>
      <div className='stripe bg-orange h-1'></div>
      {AuthStore.loggedIn ?
        (
          <>
            <Router>
              <div className='bg-white border-2 border-grey-light flex justify-between flex-wrap nav'>
                <Link to='/' className='link-btn font-bold'>HackerBudget</Link>
                <div className='navRight'>
                  <Link to='/editTxn' className='link-btn link-btn-primary'>New Transaction</Link>
                  <Link to='/editAccount' className='link-btn link-btn-secondary'>New Account</Link>
                  <Link to='/fill' className='link-btn link-btn-secondary'>Fill Envelopes</Link>
                </div>
              </div>

              <Flash />

              <Switch>
                <Route exact path='/editAccount/:accountId' component={EditAccount} />
                <Route exact path='/editAccount' component={EditAccount} />
                <Route exact path='/editTxn/:txnId' component={EditTxn} />
                <Route exact path='/editTxn' component={EditTxn} />
                <Route exact path='/fill/:txnId' component={FillEnvelopes} />
                <Route exact path='/fill' component={FillEnvelopes} />
                <Route exact path='/' component={Home} />
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
