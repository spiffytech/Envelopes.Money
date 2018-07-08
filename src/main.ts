import BootstrapVue from 'bootstrap-vue';
import Vue from 'vue';

import 'bootstrap/dist/css/bootstrap.css';
/* tslint:disable-next-line:ordered-imports */  // Can't just import CSS in any random order
import 'bootstrap-vue/dist/bootstrap-vue.css';

import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

Vue.use(BootstrapVue);

Vue.config.productionTip = false;

if (!process.env.VUE_APP_COUCH_HOST) throw new Error('CouchDB host not defined');

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
