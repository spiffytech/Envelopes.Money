import axios from 'axios';
import Vue from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import {endpoint} from '@/lib/config';

Vue.config.productionTip = false;

axios.defaults.withCredentials = true;

async function main() {
  try {
    await axios.get(`${endpoint}/isAuthed`);
    console.log('Authed');
    store.commit('setAuth', true);
    store.dispatch('transactions/load');
    store.dispatch('accounts/load');
  } catch (ex) {
    console.log('Probably not authorized');
    console.error(ex);
  }

  new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount('#app');
}

main();
