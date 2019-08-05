import Debug from 'debug';
import fromPairs from 'ramda/es/fromPairs';

const debug = Debug('Envelopes.Money:sync');

function turnAsync(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (ex) {
        reject(ex);
      }
    }, 0);
  });
}

// http://blog.ezyang.com/2012/08/how-offlineimap-works/
function setDiff(a, b) {
  return Array.from(a.values()).filter(key => !b.has(key));
}

export default async function sync(remote, local, status) {
  const remoteRecords = await remote.get();
  // Turn this asynchronous so we don't block the event loop when we load the page
  const remoteRecordsObj = await turnAsync(() =>
    fromPairs(
      remoteRecords.map(({ sha256: ignored, ...record }) => {
        const string = btoa(JSON.stringify(record));
        return [`${record.id}|${string}`, record];
      })
    )
  );
  const status1 = await status.get();
  const [storeInLocal, deleteFromLocal] = await Promise.all([
    turnAsync(() => setDiff(
      new Set(Object.keys(remoteRecordsObj)),
      new Set(status1.map(({ id, sha256 }) => `${id}|${sha256}`))
    )),
    turnAsync(() => setDiff(
      new Set(status1.map(({ id }) => id)),
      new Set(remoteRecords.map(record => record.id))
    )),
  ]);
  debug(
    'Incoming/deleted to local: %o, %o',
    storeInLocal.map(id => remoteRecordsObj[id]),
    deleteFromLocal
  );
  if (storeInLocal.length > 0) {
    await local.store(storeInLocal.map(id => remoteRecordsObj[id]));
    await status.store(
      storeInLocal.map(id => ({
        id: id.split('|')[0],
        sha256: id.split('|')[1],
      }))
    );
  }
  if (deleteFromLocal.length > 0) {
    await local.delete(deleteFromLocal.map(id => id.split('|')[0]));
    await status.delete(deleteFromLocal.map(id => id.split('|')[0]));
  }

  const localRecords = await local.get();
  // Turn this asynchronous so we don't block the event loop when we load the page
  const localRecordsObj = await turnAsync(() =>
    fromPairs(
      localRecords.map(({ sha256: ignored, ...record }) => {
        const string = btoa(JSON.stringify(record));
        return [`${record.id}|${string}`, record];
      })
    )
  );
  const status2 = await status.get();
  const [storeInRemote, deleteFromRemote] = await Promise.all([
    turnAsync(() => setDiff(
      new Set(Object.keys(localRecordsObj)),
      new Set(status2.map(({ id, sha256 }) => `${id}|${sha256}`))
    )),
    turnAsync(() => setDiff(
      new Set(status2.map(({ id }) => id)),
      new Set(localRecords.map(record => record.id))
    )),
  ]);
  debug('Outgoing/deleted to remote: %o, %o', storeInRemote, deleteFromRemote);
  if (storeInRemote.length > 0) {
    await remote.store(storeInRemote.map(id => localRecordsObj[id]));
    await status.store(
      storeInRemote.map(id => ({
        id: id.split('|')[0],
        sha256: id.split('|')[1],
      }))
    );
  }
  if (deleteFromRemote.length > 0) {
    await remote.delete(deleteFromRemote.map(id => id.split('|')[0]));
    await status.delete(deleteFromRemote.map(id => id.split('|')[0]));
  }
}
