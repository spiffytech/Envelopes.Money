import Vue from 'vue';
import Router from 'vue-router';

import EditTxn from './views/EditTxn.vue';
import Home from './views/Home.vue';
import Login from './views/Login.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },

    {
      path: '/login',
      name: 'login',
      component: Login,
    },

    {
      path: '/editTxn/:txnId',
      name: 'editTxn',
      component: EditTxn,
    },
  ],
});
