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

interface State {
  pouch: PouchDB.Database;
  couch?: PouchDB.Database;
  replicator?: PouchDB.Replication.Sync<{}>;
}

const module: Module<State, Types.RootState> = {
  namespaced: true,

  state: {
    pouch: Couch.mkLocalDB(),
  },

  mutations: {
    /**
     * Used if we have to recreate pouch with an in-memory database
     */
    setPouch(state, pouch: PouchDB.Database) {
      state.pouch = pouch;
    },

    setCouch(state, couch?: PouchDB.Database) {
      state.couch = couch;
    },

    setReplicator(state, replicator?: PouchDB.Replication.Sync<{}>) {
      state.replicator = replicator;
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
      return dispatch('replicate');
    },

    async lookUpLocalSession({commit, state}) {
      try {
        const doc = await state.pouch.get<{username: string}>('_local/session');
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
        const couch = await Couch.mkRemoteDB(rootState.username);
        commit('setCouch', couch);
        commit('setReplicator', Couch.syncDBs(state.pouch, couch));
      } else {
        console.log('Cannot replicate, no username or is offline');
        commit('setCouch', null);
        if (state.replicator) state.replicator.cancel();
      }
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
