import Vue from 'vue';
import Router from 'vue-router';

import store from './store';
import EditTxn from './views/EditTxn.vue';
import Home from './views/Home.vue';
import Login from './views/Login.vue';

Vue.use(Router);

const router = new Router({
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
      meta: {public: true},
    },

    {
      path: '/editTxn/:txnId?',
      name: 'editTxn',
      component: EditTxn,
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.public)) {
    return next();
  }

  if (store.getters.loggedIn) return next();

  return next({name: 'login'});
});

export default router;