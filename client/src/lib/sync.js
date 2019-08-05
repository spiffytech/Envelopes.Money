import Debug from 'debug';
import fromPairs from 'ramda/es/fromPairs';
import shajs from 'sha.js';

const debug = Debug('Envelopes.Money:sync');

// http://blog.ezyang.com/2012/08/how-offlineimap-works/
function setDiff(a, b) {
  return Array.from(a.values()).filter(key => !b.has(key));
}

export default async function sync(remote, local, status) {
  const remoteRecords = await remote.get();
  const remoteRecordsObj = fromPairs(
    remoteRecords.map(({ sha256: ignored, ...record }) => {
      const sha256 = shajs('sha256')
        .update(JSON.stringify(record))
        .digest('hex');
      return [`${record.id}|${sha256}`, record];
    })
  );
  const [storeInLocal, deleteFromLocal] = [
    setDiff(
      new Set(Object.keys(remoteRecordsObj)),
      new Set((await status.get()).map(({ id, sha256 }) => `${id}|${sha256}`))
    ),
    setDiff(
      new Set((await status.get()).map(({ id }) => id)),
      new Set(remoteRecords.map(record => record.id))
    ),
  ];
  debug('Incoming/deleted from local: %o, %o', storeInLocal, deleteFromLocal);
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
  const localRecordsObj = fromPairs(
    localRecords.map(({ sha256: ignored, ...record }) => {
      const sha256 = shajs('sha256')
        .update(JSON.stringify(record))
        .digest('hex');
      return [`${record.id}|${sha256}`, record];
    })
  );
  const [storeInRemote, deleteFromRemote] = [
    setDiff(
      new Set(Object.keys(localRecordsObj)),
      new Set((await status.get()).map(({ id, sha256 }) => `${id}|${sha256}`))
    ),
    setDiff(
      new Set((await status.get()).map(({ id }) => id)),
      new Set(localRecords.map(record => record.id))
    ),
  ];
  debug(
    'Outgoing/deleted to remote: %o, %o',
    storeInRemote,
    deleteFromRemote
  );
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
