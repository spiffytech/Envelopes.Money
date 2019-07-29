import Debug from "debug";
import immer from "immer";
import PouchDB from "pouchdb";
import PouchDBAuthenticaton from "pouchdb-authentication";
import PouchDBFind from "pouchdb-find";
import PouchDBUpsert from "pouchdb-upsert";

if (window._env_.USE_POUCH && !window._env_.COUCHDB) throw new Error('CouchDB setting is missing');

const debug = Debug("Envelopes.Money:pouch");
window.PouchDB = PouchDB;

PouchDB.plugin(PouchDBAuthenticaton);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);

function toHex(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}

const txnIdIndex = {
    index: { fields: ["txn_id"] },
    ddoc: "txns_txn_id_index"
};
const recordTypeIndex = {
    index: { fields: ["type_"] },
    ddoc: "record_type_index"
};

export function initMetaDB() {
    if (!window._env_.USE_POUCH) return;
    return new PouchDB("meta");
}

export default function init() {
    if (!window._env_.USE_POUCH) return;
    const localDB = new PouchDB("envelopes.money");

    localDB.createIndex(txnIdIndex).catch(console.error);
    localDB.createIndex(recordTypeIndex).catch(console.error);

    return localDB;
}

export async function initRemote(creds, localDB, pouchStore) {
  debug('Connecting to the remote CouchDB');
  const remoteDB = new PouchDB(window._env_.COUCHDB + "/userdb-" + toHex(creds.email), {
      skip_setup: true
  });
  localDB.remoteDB = remoteDB;
  await login(localDB, creds);
  sync(localDB, pouchStore);
}

export function logIn(localDB, { email, password }) {
    return localDB.remoteDB.logIn(email, password);
}

export function signUp(localDB, { email, password }) {
    return localDB.remoteDB.signUp(email, password);
}

export function sync(localDB, pouchStore) {
    debug("Setting up PouchDB replication");
    localDB
        .sync(localDB.remoteDB, { live: true, retry: true, heartbeat: 10000, batch_size: 6000 })
        .on("paused", err =>
            pouchStore.update($store =>
                immer($store, s => ({
                    ...s,
                    state: "paused",
                    stateDetail: err
                }))
            )
        )
        .on("error", err => {
            debug('Got error code %s', err.status);
            pouchStore.update($store =>
                immer($store, s => ({ ...s, state: "error", stateDetail: err }))
            );
        })
        .on("active", () =>
            pouchStore.update($store =>
                immer($store, s => ({
                    ...s,
                    state: "active",
                    stateDetail: null
                }))
            )
        )
        .on("complete", info => {
            throw new Error(
                `PouchDB replication unexpectedly completed. info is ${info}`
            );
        })
        .on("denied", err => {
            throw new Error(`PouchDB replication was denied. Error is ${err}`);
        });
}

export class PouchTransactions {
    constructor(localDB) {
        this.localDB = localDB;
    }

    async loadAll() {
        const results = await this.localDB.find({
            selector: { type_: "transaction" },
            index: "record_type_index"
        });
        return results.docs;
    }

    /**
     * @param {ITransaction[]} txns
     */
    async saveAll(txns) {
        const existingTxnsInGroup = await this.localDB.find({
            selector: { txn_id: txns[0].txn_id }
        });
        debug("Found existing txns: %O", existingTxnsInGroup);
        await Promise.all(
            existingTxnsInGroup.docs.map(doc => this.localDB.remove(doc))
        );

        await Promise.all(
            txns.map(txn =>
                this.localDB.upsert(
                    txn.id.replace(/^_+/, "☃︎"),
                    ({ _rev }) => ({
                        ...txn,
                        _id: txn.id,
                        type_: "transaction",
                        _rev
                    })
                )
            )
        );
    }

    /**
     * @param {string} txn_group_id
     */
    async delete(txn_group_id) {
        const txnsByGroupId = await this.localDB.find({
            selector: {
                txn_id: txn_group_id
            },
            use_index: "txns_txn_id_index"
        });

        await Promise.all(
            txnsByGroupId.docs.map(txn => this.localDB.remove(txn))
        );
    }
}

export class PouchAccounts {
    constructor(localDB) {
        this.localDB = localDB;
    }

    async loadAll() {
        const results = await this.localDB.find({
            selector: { type_: "account" },
            index: "record_type_index"
        });
        return results.docs;
    }

    async save(account) {
        debug("Saving account %O", account);
        await this.localDB.upsert(account.id, ({ _rev }) => ({
            ...account,
            _id: account.id,
            type_: "account",
            _rev
        }));
    }
}
