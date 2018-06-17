import VueRouter from 'vue-router';

import Login from './components/Login.vue';
import Transactions from './components/Transactions.vue';
import Categories from './components/Categories.vue';

export default new VueRouter({
  routes: [
    {
      path: '/',
      components: {
        default: Transactions,
        sidebar: Categories,
      },
    },
    {path: '/login', name: 'login', component: Login},
  ],
  mode: 'history',
})
