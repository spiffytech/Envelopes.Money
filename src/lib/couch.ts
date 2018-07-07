/* tslint:disable:no-console */
import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';
import * as PouchDBUpsert from 'pouchdb-upsert';
PouchDB.plugin(PouchDBAuthentication);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
/* tslint:disable-next-line:no-var-requires */
PouchDB.plugin(require('pouchdb-live-find'));
/* tslint:disable-next-line:no-var-requires */
PouchDB.plugin(require('pouchdb-adapter-memory').default);

(window as any).P = PouchDB;

import * as Txns from './txns';

// https://gist.github.com/valentinkostadinov/5875467
function toHex(str: string) {
  // utf8 to latin1
  const s = unescape(encodeURIComponent(str));
  let h = '';
  for (let i = 0; i < s.length; i++) {
      h += s.charCodeAt(i).toString(16);
  }
  return h;
}

async function testRemoteLogin(db: PouchDB.Database) {
  try {
    await db.allDocs({limit: 1});
    return true;
  } catch (ex) {
    /* tslint:disable-next-line:no-console */
    if (ex.status === 401) console.log('CouchDB returned 401 Unauthorized');
    throw ex;
  }
}

function isNode() {
  return typeof window === 'undefined';
}

export function getSession() {
  const remoteUrl = new URL(`/`, process.env.REACT_APP_COUCH_HOST);
  const remote = new PouchDB(remoteUrl.toString(), {skip_setup: true});
  (window as any).remote = remote;
  return remote.getSession();
}

export function mkRemoteDB(username: string, password?: string) {
  const remoteUrl = new URL(`userdb-${toHex(username)}`, process.env.REACT_APP_COUCH_HOST);

  // Cookie authentication doesn't seem to work in node for unknown reasons
  if (password && isNode()) {
    remoteUrl.username = username;
    remoteUrl.password = password;
  }
  return new PouchDB(remoteUrl.toString(), {skip_setup: true});
}

export function mkLocalDB(memory = false) {
  if (memory) return new PouchDB('local', {adapter: 'memory'});
  return new PouchDB('local');
}

export async function logIn(remote: PouchDB.Database, username: string, password: string) {
  if (isNode()) {
    const loginSuccessful = await testRemoteLogin(remote);
    if (!loginSuccessful) throw new Error('Could not log into CouchDB');
  } else {
    console.log('Trying to log in...');
    console.log(await remote.logIn(username, password));
  }
}

export function logOut(remote: PouchDB.Database) {
  return remote.logOut();
}

export function syncDBs(local: PouchDB.Database, remote: PouchDB.Database): PouchDB.Replication.Sync<{}> {
  return PouchDB.sync(local, remote, {live: true});
}

export async function upsertTxn(db: PouchDB.Database, txn: Txns.Txn) {
  /* tslint:disable-next-line:no-string-literal */
  return db.upsert(txn._id, (doc: any) => ({_rev: doc['_rev'], ...txn}));
}

export async function bulkImport(db: PouchDB.Database, txns: Txns.Txn[]) {
  return db.bulkDocs(txns);
}
