import VueRouter from 'vue-router';

import Login from './components/Login.vue';
import HelloWorld from './components/HelloWorld.vue';

export default new VueRouter({
  routes: [
    {path: '/', component: HelloWorld},
    {path: '/login', name: 'login', component: Login},
  ],
  mode: 'history',
})
