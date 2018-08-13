/* tslint:disable-next-line:no-var-requires */
(window as any).jQuery = require('jquery');
import {pipe} from 'lodash/fp';
import { then } from 'pipeable-promises/dist';
import Vue from 'vue';

import 'semantic-ui-css/semantic.min.css';
/* tslint:disable-next-line:no-var-requires */
(window as any).semantic = require('semantic-ui-css/semantic.min.js');
import 'semantic-ui-css';

import App from './App.vue';
import './registerServiceWorker';
import mkRouter from './router';
import mkStore from './store';

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
