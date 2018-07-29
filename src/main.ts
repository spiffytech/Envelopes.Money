import BootstrapVue from 'bootstrap-vue';
import {pipe} from 'lodash/fp';
import { stores } from 'nconf';
import { then } from 'pipeable-promises/dist';
import Vue from 'vue';

import 'bootstrap/dist/css/bootstrap.css';
/* tslint:disable-next-line:ordered-imports */  // Can't just import CSS in any random order
import 'bootstrap-vue/dist/bootstrap-vue.css';

import App from './App.vue';
import './registerServiceWorker';
import mkRouter from './router';
import mkStore from './store';

Vue.use(BootstrapVue);

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
)().then(console.log).catch(console.error);
