/* tslint:disable-next-line:no-var-requires */
import {pipe} from 'lodash/fp';
import { then } from 'pipeable-promises/dist';
import Vue from 'vue';

import 'bulma/css/bulma.css';

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
