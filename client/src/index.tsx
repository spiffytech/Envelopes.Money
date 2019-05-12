import axios from 'axios';
import * as jsCookie from 'js-cookie';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import {AuthStore} from './store';

axios.defaults.withCredentials = true;

if (jsCookie.get('sessionAlive')) {
  const userId = jsCookie.get('userId')!;
  const apiKey = jsCookie.get('apikey')!;
  if (userId && apiKey) {
    AuthStore.userId = userId
    AuthStore.apiKey = apiKey;
    AuthStore.loggedIn = true;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
