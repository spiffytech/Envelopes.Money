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
      if (needsMemoryPouch) {
        console.log('Using in-memory PouchDB');
        commit('setPouch', Couch.mkLocalDB(true));
      }
      return dispatch('lookUpLocalSession');
    },

    async lookUpLocalSession({commit, dispatch, state}) {
      try {
        const doc = await state.pouch.get<{username: string}>('_local/session');
        console.log('Found local session');
        commit('setUsername', doc.username, {root: true});

        const remote = await Couch.mkRemoteDB(doc.username);
        commit('setCouch', remote);

        await dispatch('oneTimeSync');
        return dispatch('replicate');
      } catch (ex) {
        console.log('Error looking up local session', ex);
        if (ex.status === 404) return;
        throw ex;
      }
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
      commit('setFlash', {msg: 'Loading data'}, {root: true});
      const sync = Couch.syncDBs(state.pouch, state.couch, false);
      sync.on('complete', () => commit('clearFlash', null, {root: true}));
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
