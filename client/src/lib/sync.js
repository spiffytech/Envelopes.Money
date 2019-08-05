import fromPairs from 'ramda/es/fromPairs';
import shajs from 'sha.js';

// http://blog.ezyang.com/2012/08/how-offlineimap-works/
function setDiff(src, status) {
  const toStore = Object.keys(src).filter(key => !status.has(key));
  const toDelete = Array.from(status.values()).filter(
    key => src[key] === undefined
  );
  return { toStore, toDelete };
}

export default async function sync(remote, local, status) {
  const remoteRecords = await remote.get();
  const remoteRecordsObj = fromPairs(
    remoteRecords.map(({ sha256: _bogus, ...record }) => {
      const sha256 = shajs('sha256')
        .update(JSON.stringify(record))
        .digest('hex');
      return [`${record.id}|${sha256}`, record];
    })
  );

  const localRecords = await local.get();
  const localRecordsObj = fromPairs(
    localRecords.map(({ sha256: _bogus, ...record }) => {
      const sha256 = shajs('sha256')
        .update(JSON.stringify(record))
        .digest('hex');
      return [`${record.id}|${sha256}`, record];
    })
  );

  const recordStatus = await status.get();
  const recordStatusSet = new Set(
    recordStatus.map(({ id, sha256 }) => `${id}|${sha256}`)
  );

  const { toStore: storeInLocal, toDelete: deleteFromLocal } = setDiff(
    remoteRecordsObj,
    recordStatusSet
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

  const { toStore: storeInRemote, toDelete: deleteFromRemote } = setDiff(
    localRecordsObj,
    recordStatusSet
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
