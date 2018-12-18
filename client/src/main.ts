import axios from 'axios';
import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import {endpoint} from '@/lib/config';

Vue.use(Vuetify);

Vue.config.productionTip = false;

axios.defaults.withCredentials = true;

async function main() {
  try {
    await axios.get(`${endpoint}/isAuthed`);
    console.log('Authed');
    const result = await axios.get(`${endpoint}/api/transactions`);
    console.log(result.data);
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
