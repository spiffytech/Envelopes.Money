<template>
  <v-app>
    <v-container fluid>
      <v-layout row>
        <LogOut></LogOut>
      </v-layout>

      <v-layout row>
        <v-flex md4>
          <router-view name="sidebar"></router-view>
        </v-flex>

        <v-flex md8>
          <router-view></router-view>
        </v-flex>
      </v-layout>
    </v-container>
    <img src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';
import LogOut from './components/LogOut.vue';

@Component({
  components: {
    HelloWorld,
    LogOut,
  },
})
export default class App extends Vue {}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
