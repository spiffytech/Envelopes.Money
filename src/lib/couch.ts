import PouchDB from 'pouchdb';
import * as PouchDBAuthentication from 'pouchdb-authentication';
import * as PouchDBUpsert from 'pouchdb-upsert';
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

export async function mkRemoteDB(username: string, password: string) {
  const remoteUrl = new URL(`userdb-${toHex(username)}`, process.env.COUCH_HOST);
  remoteUrl.username = username;
  remoteUrl.password = password;
  const remote = new PouchDB(remoteUrl.toString(), {skip_setup: true});
  const loginSuccessful = await testRemoteLogin(remote);
  if (!loginSuccessful) throw new Error('Could not log into CouchDB');

  /*
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
  console.log(ajaxOpts);
  const r = await (remote as any).login(username, password, ajaxOpts);
  console.log(r)
  console.log(await remote.getSession());
  // console.log(remote);
  */
  return remote;
}

export async function mkLocalDB(username: string, password: string) {
  const db = new PouchDB('local');
  const remote = await mkRemoteDB(username, password);
  PouchDB.sync(db, remote);

  return db;
}

export async function upsertTxn(db: PouchDB.Database, txn: Txns.Txn) {
  return db.upsert(txn._id, (doc) => ({_rev: doc['_rev'], ...txn}));
}

export async function bulkImport(db: PouchDB.Database, txns: Txns.Txn[]) {
  return db.bulkDocs(txns);
}
