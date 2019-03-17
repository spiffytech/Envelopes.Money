import {observer} from 'mobx-react';
import {navigate, Router} from '@reach/router';
import {RouteComponentProps} from '@reach/router';
import React from 'react';

import './App.css';
import Home from './components/Home';
import LogIn from './components/LogIn';
import {AuthStore} from './store';
import { storeKeyNameFromField } from 'apollo-utilities';

function Route404(props: RouteComponentProps) {
  return <p>404 not found!!1!</p>;
}

function App() {
  console.log('here');
  if (AuthStore.loggedIn) {
    return (
      <Router>
        <Home path='/' />
        <Route404 default />
      </Router>
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
