import Vue from 'vue'
import VueRouter from 'vue-router';
import Vuetify from 'vuetify'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/dist/vuetify.min.css'
import 'babel-polyfill'  // IE11 / Safari 9

import store from './store';
import router from './router';

import App from './App.vue'

Vue.use(VueRouter);
Vue.use(Vuetify);

Vue.config.productionTip = false

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
