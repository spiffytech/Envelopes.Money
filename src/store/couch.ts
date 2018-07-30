import debounce from 'lodash/debounce';
import pipe from 'lodash/fp/pipe';
import tap from 'lodash/fp/tap';
import throttle from 'lodash/throttle';
import {catchP, then} from 'pipeable-promises';
import {Module, Store} from 'vuex';

import * as Couch from '@/lib/couch';
import * as Types from './types';

/* tslint:disable:no-console */

(window as any).Couch = Couch;

let dbSync: PouchDB.Replication.Sync<any> | null = null;

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
    inSync: false,
    canTalkToRemote: false,
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

    setInSync(state, inSync) {
      state.inSync = inSync;
    },

    setReplicationActive(state, active) {
      state.canTalkToRemote = active;
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

      /* tslint:disable-next-line:no-floating-promises */
      return dispatch('lookUpLocalSession');
    },

    lookUpLocalSession({commit, dispatch, state}) {
      return pipe(
        () => state.pouch.get<{username: string}>('_local/session'),
        then(pipe(
          tap((doc: { username: string; } & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) => {
            commit('setUsername', doc.username, {root: true});
            console.log('Found local session');
          }),
          (doc) => commit('setCouch', Couch.mkRemoteDB(doc.username)),
          () => dispatch('replicate'),
        )),
        catchP((e) => {
          if ((e as any).status === 404) return console.error('Session is missing');
          console.error('Error initializing session');
          throw e;
        }),
      )();
    },

    async replicate({commit, rootState, state}) {
      if (rootState.username && rootState.isOnline) {
        console.log('Beginning replication');
        if (!state.couch) throw new Error('Can\'t replicate, CouchDB remote is undefined');

        const clearFlash = debounce(
          () => commit('setSyncing', false, {root: true}),
          2000,
          {leading: false, trailing: true},
        );

        dbSync = Couch.syncDBs(state.pouch, state.couch);

        dbSync.on(
          'change',
          throttle(
            () => {
              commit('setSyncing', true, {root: true});
              clearFlash();
            },
            500,
            {leading: true, trailing: false},
          ),
        );

        dbSync.on(
          'paused',
          () => commit('setInSync', true),
        );

        dbSync.on(
          'active',
          () => commit('setReplicationActive', true),
        );

        commit('setReplicator', dbSync);
      } else {
        console.log('Cannot replicate, no username or is offline');
        if (state.replicator) state.replicator.cancel();
      }
    },

    async logIn({commit, dispatch, state}, {username, password}: {username: string, password: string}) {
      console.log('Logging in');
      const remote = Couch.mkRemoteDB(username);
      await Couch.logIn(remote, username, password);
      console.log('Login successful');
      commit('setCouch', remote);

      // Always destroy just in case we're logged out without hitting the
      // 'logout' button. Wouldn't want anyone seeing another user's data on a
      // public computer.
      try {
        await state.pouch.destroy();
      } catch (ex) {
        console.error('Database is already destroyed');
      }
      commit('setPouch', Couch.mkLocalDB());  // Covers recreating the DB after a logout destroys it
      commit('setUsername', username, {root: true});
      try {
        await state.pouch.upsert('_local/session', (doc: any) => ({...doc, username}));
      } catch (ex) {
        console.error(ex);
      }

      commit('setCouch', remote);
      /* tslint:disable-next-line:no-floating-promises */
      dispatch('replicate');
    },

    async logOut({commit, state}) {
      console.log('Logging out');
      if (dbSync) dbSync.cancel();
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
