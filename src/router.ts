import Vue from 'vue';
import Router from 'vue-router';
import {Store} from 'vuex';

import * as StoreTypes from '@/store/types';
import EditTxn from './views/EditTxn.vue';
import Home from './views/Home.vue';
import Login from './views/Login.vue';

import Accounts from '@/components/Accounts.vue'; // @ is an alias to /src
import Categories from '@/components/Categories.vue';
import Transactions from '@/components/Transactions.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      component: Home,
      children: [
        {path: '', name: 'home', component: Categories},
        {path: 'accounts', name: 'home/accounts', component: Accounts},
        {path: 'transactions', name: 'home/transactions', component: Transactions},
      ],
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

export default function mkRouter(store: Store<StoreTypes.RootState>) {
  router.beforeEach((to, _from, next) => {
    if (to.matched.some((record) => record.meta.public)) {
      return next();
    }

    if (store.getters.loggedIn) return next();

    return next({name: 'login'});
  });

  return router;
}
