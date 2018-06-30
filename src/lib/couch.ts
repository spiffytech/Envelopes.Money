/* tslint:disable:no-console */
import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
import * as PouchDBUpsert from 'pouchdb-upsert';
console.log(PouchDBAuthentication)
PouchDB.plugin(PouchDBAuthentication);
PouchDB.plugin(PouchDBUpsert);

import * as Txns from './txns';

// https://gist.github.com/valentinkostadinov/5875467
function toHex(str: string) {
  // utf8 to latin1
  const s = unescape(encodeURIComponent(str))
  let h = ''
  for (let i = 0; i < s.length; i++) {
      h += s.charCodeAt(i).toString(16)
  }
  return h
}

async function testRemoteLogin(db: PouchDB.Database) {
  try {
    await db.allDocs({limit: 1});
    return true;
  } catch(ex) {
    /* tslint:disable-next-line:no-console */
    if (ex.status === 401) console.log('CouchDB returned 401 Unauthorized');
    throw ex;
  }
}

function isNode() {
  return typeof window === 'undefined';
}

export async function mkRemoteDB(username: string, password: string) {
  const remoteUrl = new URL(`userdb-${toHex(username)}`, process.env.REACT_APP_COUCH_HOST);

  // Cookie authentication doesn't seem to work in node for unknown reasons
  if (isNode()) {
    remoteUrl.username = username;
    remoteUrl.password = password;
  }
  const remote = new PouchDB(remoteUrl.toString(), {skip_setup: true});

  if (isNode()) {
    const loginSuccessful = await testRemoteLogin(remote);
    if (!loginSuccessful) throw new Error('Could not log into CouchDB');
  } else {
    // Something something authenticating request against _session
    const authStr = username + ':' + password;
    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + (
            typeof window === 'undefined' ?
            Buffer.from(authStr).toString('base64') :
            btoa(authStr)
          )
        }
      }
    };
    console.log('Trying to log in...');
    console.log(remote)
    console.log(await (remote as any).logIn(username, password, ajaxOpts));
  }

  return remote;
}

export function mkLocalDB() {
  return new PouchDB('local');
}

export function logOut(remote: PouchDB.Database) {
  return remote.logOut();
}

export async function syncDBs(local: PouchDB.Database, remote: PouchDB.Database) {
  PouchDB.sync(local, remote);
}

export async function upsertTxn(db: PouchDB.Database, txn: Txns.Txn) {
  /* tslint:disable-next-line:no-string-literal */
  return db.upsert(txn._id, (doc) => ({_rev: doc['_rev'], ...txn}));
}

export async function bulkImport(db: PouchDB.Database, txns: Txns.Txn[]) {
  return db.bulkDocs(txns);
}
