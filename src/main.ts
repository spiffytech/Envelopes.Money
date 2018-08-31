import {pipe} from 'lodash/fp';
/* tslint:disable-next-line:no-var-requires */
// const logrocket = require('logrocket');
import { then } from 'pipeable-promises/dist';
import Vue from 'vue';

import 'bulma/css/bulma.css';

import App from './App.vue';
import './registerServiceWorker';
import mkRouter from './router';
import mkStore from './store';

// logrocket.init(process.env.VUE_APP_LOGROCKET);

Vue.config.productionTip = false;

if (!process.env.VUE_APP_COUCH_HOST) throw new Error('CouchDB host not defined');

pipe(
  () => mkStore(),
  then((store) => Promise.all([store, mkRouter(store)])),
  then(([store, router]) =>
    new Vue({
      router,
      store,
      render: (h) => h(App),
    }).
    $mount('#app'),
  ),
)().catch(console.error);
