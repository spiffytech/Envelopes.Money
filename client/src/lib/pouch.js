import Debug from 'debug';
import immer from 'immer';
import groupBy from 'ramda/es/groupBy';
import PouchDB from 'pouchdb';
import PouchDBAuthenticaton from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';
import PouchDBUpsert from 'pouchdb-upsert';
import shortid from 'shortid';

if (window._env_.USE_POUCH && !window._env_.COUCHDB)
  throw new Error('CouchDB setting is missing');

const debug = Debug('Envelopes.Money:pouch');
window.PouchDB = PouchDB;

PouchDB.plugin(PouchDBAuthenticaton);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);

function toHex(str) {
  var result = '';
  for (var i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}

const txnIdIndex = {
  index: { fields: ['txn_id'] },
  ddoc: 'txns_txn_id_index',
};
const recordTypeIndex = {
  index: { fields: ['type_'] },
  ddoc: 'record_type_index',
};
const accountNameIndex = {
  index: { fields: ['type_', 'name'] },
  ddoc: 'account_name_index',
};

export function initMetaDB() {
  if (!window._env_.USE_POUCH) return;
  return new PouchDB('meta');
}

export default function init() {
  if (!window._env_.USE_POUCH) return;
  const localDB = new PouchDB('envelopes.money');

  localDB.createIndex(txnIdIndex).catch(console.error);
  localDB.createIndex(recordTypeIndex).catch(console.error);
  localDB.createIndex(accountNameIndex).catch(console.error);
  const balancesByDateDdoc = {
    _id: '_design/balances-by-date',
    views: {
      balances: {
        map: function(doc) {
          if (doc.type_ !== 'transaction') return;
          emit([doc.from_id, doc.date], -doc.amount);
          emit(
            [doc.to_id, doc.date],
            doc.amount * (doc.type === 'banktxn' ? -1 : 1)
          );
        }.toString(),
        reduce: '_sum',
      },
    },
  };
  localDB
    .upsert(balancesByDateDdoc._id, doc => ({
      ...balancesByDateDdoc,
      _rev: doc._rev,
    }))
    .catch(err => console.error(err));

  const balancesDdoc = {
    _id: '_design/balances',
    views: {
      balances: {
        map: function(doc) {
          if (doc.type_ !== 'transaction') return;
          emit(doc.from_id, -doc.amount);
          emit(doc.to_id, doc.amount * (doc.type === 'banktxn' ? -1 : 1));
        }.toString(),
        reduce: '_sum',
      },
    },
  };
  localDB
    .upsert(balancesDdoc._id, doc => ({ ...balancesDdoc, _rev: doc._rev }))
    .catch(err => console.error(err));

  const transactionsDdoc = {
    _id: '_design/transactions',
    views: {
      'by-account': {
        map: function(doc) {
          if (doc.type_ !== 'transaction') return;
          emit([doc.from_id, doc.date]);
          emit([doc.to_id, doc.date]);
        }.toString(),
      },
    },
  };
  localDB
    .upsert(transactionsDdoc._id, doc => ({
      ...transactionsDdoc,
      _rev: doc._rev,
    }))
    .catch(err => console.error(err));

  return localDB;
}

export function mkRemote(username) {
  return new PouchDB(window._env_.COUCHDB + '/userdb-' + toHex(username), {
    skip_setup: true,
  });
}

export async function initRemote(creds, localDB, remoteDB, pouchStore) {
  debug('Connecting to the remote CouchDB');
  localDB.remoteDB = remoteDB;
  await logIn(localDB, creds);
  sync(localDB, pouchStore);
}

export function logIn(localDB, { email, password }) {
  return localDB.remoteDB.logIn(email, password);
}

export function signUp(localDB, { email, password }) {
  return localDB.remoteDB.signUp(email, password);
}

export function sync(localDB, pouchStore) {
  debug('Setting up PouchDB replication');
  localDB
    .sync(localDB.remoteDB, {
      live: true,
      retry: true,
      heartbeat: 10000,
      batch_size: 6000,
    })
    .on('paused', err =>
      pouchStore.update($store =>
        immer($store, s => ({
          ...s,
          state: 'paused',
          stateDetail: err,
        }))
      )
    )
    .on('error', err => {
      debug('Got error code %s', err.status);
      pouchStore.update($store =>
        immer($store, s => ({ ...s, state: 'error', stateDetail: err }))
      );
    })
    .on('active', () =>
      pouchStore.update($store =>
        immer($store, s => ({
          ...s,
          state: 'active',
          stateDetail: null,
        }))
      )
    )
    .on('complete', info => {
      throw new Error(
        `PouchDB replication unexpectedly completed. info is ${info}`
      );
    })
    .on('denied', err => {
      throw new Error(`PouchDB replication was denied. Error is ${err}`);
    });
}

export class PouchTransactions {
  constructor(localDB) {
    this.localDB = localDB;
  }

  async loadAll() {
    const results = await this.localDB.allDocs({
      startkey: 'transaction/',
      endkey: 'transaction/\ufff0',
      include_docs: true,
    });
    return results.rows.map(row => row.doc);
  }

  groupTxns(txns) {
    const groups = groupBy(txn => txn.txn_id, txns);
    return Object.values(groups).map(txnGroup => ({
      to_ids: txnGroup.map(txn => txn.to_id),
      amount: txnGroup
        .map(txn => -txn.amount)
        .reduce((acc, item) => acc + item, 0),
      txn_id: txnGroup[0].txn_id,
      user_id: txnGroup[0].user_id,
      label: txnGroup[0].label,
      date: txnGroup[0].date,
      memo: txnGroup[0].memo,
      from_id: txnGroup[0].from_id,
      type: txnGroup[0].type,
      insertionOrder: txnGroup[0].insertion_order,
      cleared: txnGroup[0].cleared,
    }));
  }

  async loadTxns(txnIds) {
    const { results } = await this.localDB.bulkGet({
      docs: txnIds.map(txnId => ({ id: txnId })),
    });
    return results;
  }

  /**
   * @param {ITransaction[]} txns
   */
  async saveAll(txns) {
    const existingTxnsInGroup = await this.localDB.find({
      selector: { txn_id: txns[0].txn_id },
    });
    debug('Found existing txns: %O', existingTxnsInGroup);
    await Promise.all(
      existingTxnsInGroup.docs.map(doc => this.localDB.remove(doc))
    );

    await Promise.all(
      txns.map(txn =>
        this.localDB.upsert(txn.id.replace(/^_+/, '☃︎'), ({ _rev }) => ({
          ...txn,
          _id: txn.id,
          type_: 'transaction',
          _rev,
        }))
      )
    );
  }

  /**
   * @param {string} txn_group_id
   */
  async delete(txn_group_id) {
    const txnsByGroupId = await this.localDB.find({
      selector: {
        txn_id: txn_group_id,
      },
      use_index: 'txns_txn_id_index',
    });

    await Promise.all(txnsByGroupId.docs.map(txn => this.localDB.remove(txn)));
  }
}

export class PouchAccounts {
  constructor(localDB) {
    this.localDB = localDB;
  }

  async initializeSystemAccounts() {
    const accounts = await this.loadAll();
    const systemAccounts = accounts.filter(account =>
      account.name.match(/\[.*\]/)
    );
    if ((await this.findByName('[Unallocated]')).length === 0) {
      debug('Creating [Unallocated] account');
      await this.save({
        id: shortid.generate(),
        name: '[Unallocated]',
        type: 'envelope',
        extra: {},
        tags: {},
      });
    }
    if ((await this.findByName('[Equity]')).length === 0) {
      debug('Creating [Equity] account');
      await this.save({
        id: shortid.generate(),
        name: '[Equity]',
        type: 'account',
        extra: {},
      });
    }
  }

  async findByName(name) {
    const { docs } = await this.localDB.find({
      selector: { $and: [{ type_: 'account' }, { name }] },
      index: 'account_name_index',
    });
    return docs;
  }

  async txnsForAccount(accountId) {
    const { rows } = await this.localDB.query('transactions/by-account', {
      startkey: [accountId, '\ufff0'],
      endkey: [accountId, ''],
      include_docs: true,
      descending: true
    });
    return rows.map(({ doc }) => doc);
  }

  async loadAll() {
    const [
      { rows: accountRows },
      { rows: categoryRows },
      { rows: envelopeRows },
    ] = await Promise.all([
      this.localDB.allDocs({
        startkey: 'account/',
        endkey: 'account/\ufff0',
        include_docs: true,
      }),
      this.localDB.allDocs({
        startkey: 'category/',
        endkey: 'category/\ufff0',
        include_docs: true,
      }),
      this.localDB.allDocs({
        startkey: 'envelope/',
        endkey: 'envelope/\ufff0',
        include_docs: true,
      }),
    ]);

    return [...accountRows, ...categoryRows, ...envelopeRows].map(
      row => row.doc
    );
  }

  async save(account) {
    debug('Saving account %O', account);
    await this.localDB.upsert(account.id, ({ _rev }) => ({
      ...account,
      _id: account.id,
      type_: 'account',
      _rev,
    }));
  }
}
