/* tslint:disable:no-console */
import {get, map as _map} from 'lodash/fp';
import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';
import * as PouchDBUpsert from 'pouchdb-upsert';
/* tslint:disable-next-line:no-var-requires */
// PouchDB.plugin(require('pouchdb-debug'));
PouchDB.plugin(PouchDBAuthentication);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
/* tslint:disable-next-line:no-var-requires */
PouchDB.plugin(require('pouchdb-adapter-memory'));

// PouchDB.debug.enable('*');
PouchDB.debug.disable();

import * as Future from 'fluture';
/* tslint:disable-next-line:no-var-requires */
const {env: flutureEnv} = require('fluture-sanctuary-types');
import {create, env} from 'sanctuary';
const S = create({checkTypes: true, env: env.concat(flutureEnv)});

import * as Txns from './txns';

interface DesignDoc {
  _id: string;
  version: number;
  _rev?: string;
  filters?: {[key: string]: string};
  views?: {
    lib?: any;
    [key: string]: {
      map: string;
      reduce?: string;
    };
  };
}

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
  const remoteUrl = new URL(`/`, process.env.VUE_APP_COUCH_HOST);
  const remote = new PouchDB<{}>(remoteUrl.toString(), {skip_setup: true});
  (window as any).remote = remote;
  return remote.getSession();
}

export function mkRemoteDB(username: string, password?: string) {
  const remoteUrl = new URL(`userdb-${toHex(username)}`, process.env.VUE_APP_COUCH_HOST);

  // Cookie authentication doesn't seem to work in node for unknown reasons
  if (password && isNode()) {
    remoteUrl.username = username;
    remoteUrl.password = password;
  }
  const couch = new PouchDB<{}>(remoteUrl.toString(), {skip_setup: true});
  (couch as any).setMaxListeners(20);
  return couch;
}

export function mkLocalDB(memory = false) {
  if (memory) return new PouchDB<{}>('local', {adapter: 'memory'});
  const pouch = new PouchDB<{}>('local');
  (pouch as any).setMaxListeners(20);
  return pouch;
}

export async function logIn(remote: PouchDB.Database, username: string, password: string) {
  if (isNode()) {
    const loginSuccessful = await testRemoteLogin(remote);
    if (!loginSuccessful) throw new Error('Could not log into CouchDB');
  } else {
    console.log(remote);
    console.log('Trying to log in...');
    console.log(await remote.logIn(username, password));
    const loginSuccessful = await testRemoteLogin(remote);
    if (!loginSuccessful) throw new Error('Could not log into CouchDB');
  }
}

export function logOut(remote: PouchDB.Database) {
  return remote.logOut();
}

export function syncDBs(
  local: PouchDB.Database, remote: PouchDB.Database, live = true,
): PouchDB.Replication.Sync<{}> {
  return PouchDB.sync(local, remote, {live, retry: true, batch_size: 500});
}

export async function bulkImport(db: PouchDB.Database, txns: Txns.Txn[]) {
  return db.bulkDocs(txns);
}

export function upsertCategory(db: PouchDB.Database, category: Txns.Category) {
  /* tslint:disable-next-line:no-string-literal */
  return db.upsert(category._id, (doc: any) => ({_rev: doc['rev'], ...category}));
}

export function upsertAccount(db: PouchDB.Database, account: Txns.Account) {
  /* tslint:disable-next-line:no-string-literal */
  return db.upsert(account._id, (doc: any) => ({_rev: doc['rev'], ...account}));
}

export async function upsertTxn(db: PouchDB.Database, txn: Txns.Txn) {
  /* tslint:disable-next-line:no-string-literal */
  return db.upsert(txn._id, (doc: any) => ({_rev: doc['_rev'], ...txn}));
}

export function getDesignDoc(couch: PouchDB.Database, docName: string) {
  return (
    Future.tryP(() => (couch as PouchDB.Database<DesignDoc>).get(docName)).
    fold(S.Left, S.Right)
  );
}

export async function getAccountBalances(db: PouchDB.Database): Promise<Txns.Balance[]> {
  return (await db.query('accounts/balances', {group: true, reduce: true})).
    rows.
    map(({key, value}) => ({name: key, balance: value}));
}

export async function getCategoryBalances(db: PouchDB.Database): Promise<Txns.Balance[]> {
  return (await db.query('categories/balances', {group: true})).
    rows.
    map(({key, value}) => ({name: key, balance: value}));
}

export async function watchSelector<T>(
  db: PouchDB.Database<T>,
  selector: PouchDB.Find.Selector,
  onChange: (records: T[]) => any,
) {
  const getNewRecords = async () => {
    // The limit must stay below an unsigned long or we'll get IndexedDB errors
    const records = await db.find({selector, limit: (2 ** 32) - 1});
    onChange(records.docs);
  };

  const subscription = db.changes({
    since: 'now',
    live: true,
    selector,
  });

  subscription.on('change', getNewRecords);
  subscription.on('error', (e) => { throw e; });
  await getNewRecords();
  return subscription;
}

export function getTxns(db: PouchDB.Database, limit: number): Future.Future<any, Array<Txns.Txn | undefined>> {
  return Future.tryP(() => db.allDocs<Txns.Txn>({
    startkey: 'txn/\uffff',
    endkey: 'txn/',
    include_docs: true,
    limit,
    descending: true,
  })).
  map(get('rows')).
  map(_map(get('doc')));
}

/**
 * Prevents TypeScript from doing any other imports when using 'emit' inside design docs
 */
declare var emit: any;

export function createDesignDoc(couch: PouchDB.Database, doc: DesignDoc) {
  return Future.tryP(() => couch.put(doc as any)).fold(S.Left, S.Right);
}

export function upsertDesignDoc(couch: PouchDB.Database, doc: DesignDoc) {
  const getDoc = () => getDesignDoc(couch, doc._id);
  return (
    getDoc().
    chain(
      S.either(
        () => createDesignDoc(couch, doc).chain(getDoc),
      )(
        (dbDoc) => {
          if (dbDoc.version !== doc.version) {
            return createDesignDoc(couch, {...doc, _rev: dbDoc._rev}).
              chain(getDoc);
          } else {
            return Future.of(S.Right(dbDoc));
          }
        },
      ),
    )
  );
}

/* tslint:disable:only-arrow-functions */
// Have to disable ES6 features for CouchDB
/* tslint:disable:no-var-keyword */
/* tslint:disable:prefer-const */
export const designDocs: {[key: string]: DesignDoc} = {
  accounts: {
    _id: '_design/accounts',
    version: new Date().getTime(),
    views: {
      /*
      lib: {
        journalToLedger: Txns.journalToLedger.toString() as any,
        touchesBank: Txns.touchesBank.toString() as any,
      } as any,
      */

      balances: {
        map: function(doc: any) {
          if (doc.type === 'banktxn') {
            emit(doc.account, doc.amount);
            return;
          } else if (doc.type === 'accountTransfer') {
            emit(doc.from, doc.amount);
            emit(doc.to, -doc.amount);
            return;
          }
        }.toString(),
        reduce: '_sum',
      },
    },
  },

  categories: {
    _id: '_design/categories',
    version: new Date().getTime(),
    views: {
      balances: {
        map: function(doc: Txns.Txn) {
          if (doc.type === 'banktxn') {
            for (var category in doc.categories) {
              if (doc.categories.hasOwnProperty(category)) {
                emit(doc.categories[category].name, doc.categories[category].amount);
              }
            }
          } else if (doc.type === 'envelopeTransfer') {
            emit(doc.from, doc.amount);
            emit(doc.to, -doc.amount);
            return;
          }
        }.toString(),
        reduce: '_sum',
      },
    },
  },
};
