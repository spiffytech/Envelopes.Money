import VueRouter from 'vue-router';

import Login from './components/Login.vue';
import Transactions from './components/Transactions.vue';
import HomeSidebar from './components/HomeSidebar.vue';

export default new VueRouter({
  routes: [
    {
      path: '/',
      components: {
        default: Transactions,
        sidebar: HomeSidebar,
      },
    },
    {path: '/login', name: 'login', component: Login},
  ],
  mode: 'history',
})
