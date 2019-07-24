import PouchDB from 'pouchdb';
import PouchDBAuthenticaton from 'pouchdb-authentication';

PouchDB.plugin(PouchDBAuthenticaton);

function toHex(str) {
var result = '';
for (var i=0; i<str.length; i++) {
    result += str.charCodeAt(i).toString(16);
}
return result;
}

export default function init(username, password) {
    if (!window._env_.USE_POUCH) return;
    const localDB = new PouchDB('envelopes.money');
    const remoteDB = window._env_.COUCHDB ? new PouchDB(window._env_.COUCHDB + '/userdb-' + toHex(username), {skip_setup: true}) : null
    localDB.remoteDB = remoteDB;
    remoteDB.logIn(username, password).catch(console.error);

    localDB.sync(remoteDB, {live: true, retry: true}).on('error', console.error);
    remoteDB.sync(localDB, {live: true, retry: true}).on('error', console.error);

    window.localDB = localDB;
    return localDB;
}
