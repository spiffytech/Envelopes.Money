import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import {AuthStore} from './store';
import {endpoint} from './lib/config';

axios.defaults.withCredentials = true;

axios.get(`${endpoint}/isAuthed`).then((response) => {
  AuthStore.loggedIn = response.data.isAuthed;
  AuthStore.userId = response.data.userId;
  AuthStore.apiKey = response.data.apiKey;
}).finally(() => {
  ReactDOM.render(<App />, document.getElementById('root'));
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
