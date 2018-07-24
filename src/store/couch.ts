import {Future} from 'funfix';
import tap from 'lodash/fp/tap';
import PouchDB from 'pouchdb';
import {Module, Store} from 'vuex';

import * as Couch from '@/lib/couch';
import * as Types from './types';

/* tslint:disable:no-console */

(window as any).Couch = Couch;

/**
 * Firefox private browsing doesn't have indexeddb support
 */
function hasIndexDB() {
  return new Promise<boolean>((resolve) => {
    const db = indexedDB.open('test');
    db.onerror = () => resolve(true);
    db.onsuccess = () => resolve(false);
  });
}

const module: Module<Types.CouchState, Types.RootState> = {
  namespaced: true,

  state: {
    pouch: Couch.mkLocalDB(),
  },

  mutations: {
    /**
     * Used if we have to recreate pouch with an in-memory database
     */
    setPouch(state, newPouch: PouchDB.Database) {
      state.pouch = newPouch;
    },

    setCouch(state, newCouch?: PouchDB.Database) {
      state.couch = newCouch;
    },

    setReplicator(state, newReplicator?: PouchDB.Replication.Sync<{}>) {
      state.replicator = newReplicator;
    },
  },

  actions: {
    async init({commit, dispatch}) {
      console.log('Initializing store');
      const needsMemoryPouch = await hasIndexDB();
      const pouch = Couch.mkLocalDB(needsMemoryPouch);
      if (needsMemoryPouch) {
        console.log('Using in-memory PouchDB');
      }
      commit('setPouch', pouch);

      await Couch.upsertDesignDoc(pouch, Couch.designDocs.accounts).promise();
      await Couch.upsertDesignDoc(pouch, Couch.designDocs.categories).promise();

      return dispatch('lookUpLocalSession');
    },

    lookUpLocalSession({commit, dispatch, state}) {
      return Future.fromPromise(state.pouch.get<{username: string}>('_local/session')).
      map(tap((doc) => commit('setUsername', doc.username, {root: true}))).
      map(tap(() => console.log('Found local session'))).
      map((doc) => Couch.mkRemoteDB(doc.username)).
      map((remote) => commit('setCouch', remote)).
      map(() => dispatch('oneTimeSync')).
      map(() => dispatch('replicate')).
      recover((e) => {
        if ((e as any).status === 404) return console.error('Session is missing');
        console.error('Error initializing session');
        throw e;
      }).
      toPromise();
    },

    /**
     * Used when logging in so the user doesn't stare at a blank page waiting
     * for replication
     */
    async oneTimeSync({commit, rootState, state}) {
      if (!state.couch) throw new Error('Cannot sync couch, it doesn\'t exist');
      if (!rootState.isOnline) {
        console.error('Can\'t sync because we\'re offline');
        return null;
      }
      console.log('Performing one-time sync');
      commit('setFlash', {msg: 'Syncing data'}, {root: true});
      const sync = Couch.syncDBs(state.pouch, state.couch, false);
      return new Promise((resolve, reject) => {
        sync.on('complete', () => {
          commit('clearFlash', null, {root: true});
          resolve();
        });

        sync.on('error', (err) => {
          commit('setFlash', {msg: (err as any).message, type: 'error'}, {root: true});
          reject(err);
        });
      });
    },

    async replicate({commit, rootState, state}) {
      if (rootState.username && rootState.isOnline) {
        console.log('Beginning replication');
        if (!state.couch) throw new Error('Can\'t replicate, CouchDB remote is undefined');
        commit('setReplicator', Couch.syncDBs(state.pouch, state.couch));
      } else {
        console.log('Cannot replicate, no username or is offline');
        if (state.replicator) state.replicator.cancel();
      }
    },

    async logIn({commit, dispatch, state}, {username, password}: {username: string, password: string}) {
      console.log('Logging in');
      const remote = await Couch.mkRemoteDB(username);
      await Couch.logIn(remote, username, password);
      console.log('Login successful');

      commit('setPouch', Couch.mkLocalDB());  // Covers recreating the DB after a logout destroys it
      commit('setCouch', remote);
      commit('setUsername', username, {root: true});
      try {
        await state.pouch.upsert('_local/session', (doc: any) => ({...doc, username}));
      } catch (ex) {
        console.error(ex);
      }

      commit('setCouch', remote);
      await dispatch('oneTimeSync');
      return dispatch('replicate');
      // TODO: Subscribe to Txns feed
    },

    async logOut({commit, state}) {
      console.log('Logging out');
      if (state.couch) {
        await Couch.logOut(state.couch);
      }
      commit('setUsername', null, {root: true});
      await state.pouch.destroy();
    },
  },
};

export const watchers = [
  {
    getter: (state: Types.RootState) => state.isOnline,
    handler: (store: Store<Types.RootState>) => () => store.dispatch('couch/replicate'),
    immediate: false,
  },
];

export default module;
