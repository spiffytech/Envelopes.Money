import PouchDB from 'pouchdb';
import {Module, Store} from 'vuex';

import * as Couch from '@/lib/couch';
import * as Types from './types';

/* tslint:disable:no-console */

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

let pouch = Couch.mkLocalDB();
let couch: PouchDB.Database | undefined;
let replicator: PouchDB.Replication.Sync<{}> | undefined;

(window as any).Couch = Couch;

const module: Module<{}, Types.RootState> = {
  namespaced: true,

  state: {
  },

  mutations: {
    /**
     * Used if we have to recreate pouch with an in-memory database
     */
    setPouch(state, newPouch: PouchDB.Database) {
      pouch = newPouch;
    },

    setCouch(state, newCouch?: PouchDB.Database) {
      couch = newCouch;
    },

    setReplicator(state, newReplicator?: PouchDB.Replication.Sync<{}>) {
      replicator = newReplicator;
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
    },

    async lookUpLocalSession({commit, state}) {
      try {
        const doc = await pouch.get<{username: string}>('_local/session');
        console.log('Found local session');
        return commit('setUsername', doc.username);
      } catch (ex) {
        console.log('Error looking up local session', ex);
        if (ex.status === 404) return;
        throw ex;
      }
    },

    async replicate({commit, state, rootState}) {
      if (rootState.username && rootState.isOnline) {
        console.log('Logged in, beginning replication');
        if (!couch) throw new Error('Can\'t replicate, CouchDB remote is undefined');
        commit('setReplicator', Couch.syncDBs(pouch, couch));
      } else {
        console.log('Cannot replicate, no username or is offline');
        if (replicator) replicator.cancel();
      }
    },

    async logIn({commit, dispatch}, {username, password}: {username: string, password: string}) {
      console.log('Logging in');
      const remote = await Couch.mkRemoteDB(username);
      await Couch.logIn(remote, username, password);
      console.log(await remote.getSession());
      console.log('Login successful');

      commit('setPouch', Couch.mkLocalDB());  // Covers recreating the DB after a logout destroys it
      commit('setUsername', username, {root: true});
      try {
        await pouch.upsert('_local/session', (doc: any) => ({...doc, username}));
      } catch (ex) {
        console.error(ex);
      }

      commit('setCouch', remote);
      console.log(await(remote.allDocs()));
      return dispatch('replicate');
      // TODO: Subscribe to Txns feed
    },
  },
};

export const watchers = [
  {
    getter: (state: Types.RootState) => [state.isOnline, state.username],
    handler: (store: Store<Types.RootState>) => () => store.dispatch('couch/replicate'),
  },

  {
    getter: (state: Types.RootState) => [state.isOnline, state.username],
    handler: (store: Store<Types.RootState>) => () => console.log('here2'),
  },
];

export default module;
