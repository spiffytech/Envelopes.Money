import PouchDB from "pouchdb";
import PouchDBAuthenticaton from "pouchdb-authentication";
import PouchDBFind from "pouchdb-find";
import PouchDBUpsert from "pouchdb-upsert";

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
  ddoc: 'txns_txn_id_index'
};

export default function init(username, password) {
  if (!window._env_.USE_POUCH) return;
  const localDB = new PouchDB("envelopes.money");
  const remoteDB = window._env_.COUCHDB
    ? new PouchDB(window._env_.COUCHDB + "/userdb-" + toHex(username), {
        skip_setup: true
      })
    : null;
  localDB.remoteDB = remoteDB;
  remoteDB
    .logIn(username, password)
    .then(() => {
      localDB
        .sync(remoteDB, { live: true, retry: true })
        .on("error", console.error);
      remoteDB
        .sync(localDB, { live: true, retry: true })
        .on("error", console.error);

      localDB.createIndex(txnIdIndex).catch(console.error);
    })
    .catch(console.error);

  window.localDB = localDB;
  return localDB;
}

export class PouchTransactions {
  constructor(localDB) {
    this.localDB = localDB;
  }

  /**
   * @param {ITransaction[]} txns
   */
  async save(txns) {
    return Promise.all(
      txns.map(txn =>
        this.localDB.upsert(txn.id.replace(/^_+/, "☃︎"), ({ _rev }) => ({
          ...txn,
          _id: txn.id,
          _rev
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
              txn_id: txn_group_id
          },
          use_index: 'txns_txn_id_index'
      })

      await Promise.all(txnsByGroupId.map((txn) => this.localDB.remove(txn)));
  }
}
