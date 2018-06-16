import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import router from './router';

firebase.initializeApp({
  apiKey: "AIzaSyA4sCttFmUIJcWk2cNZC2adPwtszGNJkBQ",
  authDomain: "warbucks-fcd3f.firebaseapp.com",
  databaseURL: "https://warbucks-fcd3f.firebaseio.com",
  projectId: "warbucks-fcd3f",
  storageBucket: "warbucks-fcd3f.appspot.com",
  messagingSenderId: "291722920421"
});

interface State {
  email: string | null;
}

const store = new Vuex.Store<State>({
    state: {
      email: null,
    },

    getters: {
      loggedIn(state) {
        return Boolean(state.email)
      }
    },

    mutations: {
      setUsername(state, email: string) {
        state.email = email;
      }
    },

    actions: {
      async logIn({dispatch}, {email}: {email: string}) {
        // This is for if the user signs in on a different device than from
        // which the requested the email link, and we don't have their email in
        // local storage

        if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
          return dispatch('tryFinishLogin');
        }

        console.log('domain', process.env.DOMAIN)

        const options = {
          // URL you want to redirect back to. The domain (www.example.com) for this
          // URL must be whitelisted in the Firebase Console.
          url: `${process.env.VUE_APP_DOMAIN}/login`,
          // This must be true.
          handleCodeInApp: true,
        }
        await firebase.auth().sendSignInLinkToEmail(email, options);
        localStorage.setItem('emailForSignIn', email); // Will be verified in second half of login
      },

      logOut() {
        return firebase.auth().signOut();
      },

      async tryFinishLogIn() {
        if (!firebase.auth().isSignInWithEmailLink(window.location.href)) {
          return;
        }

        const email = localStorage.getItem('emailForSignIn');
        if (!email) throw new Error('Email is not stored in localStorage');

        await firebase.auth().signInWithEmailLink(
          email, window.location.href
        );
        localStorage.removeItem('emailForSignIn');

        router.push('/');
      },
    }
});

firebase.auth().onAuthStateChanged((user) =>
  store.commit('setUsername', user ? user.email : null)
)

export default store;