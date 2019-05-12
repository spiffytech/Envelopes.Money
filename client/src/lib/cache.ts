import localForage from 'localforage';
import preval from 'preval.macro';

// This is used to apply a build-specific suffix to our cache keys, so if we
// deploy a new app version the cache is invalidated and we don't load old
// values with legacy data structures
const suffix = preval`module.exports = new Date().getTime()`;

export async function cache(key: string, data: any) {
  await localForage.setItem(key, JSON.stringify(data));
  return;
}

async function cleanUpCache() {
  const keysToPurge =
    (await localForage.keys())
    .filter((key) => key.startsWith('cache/') && !key.endsWith(suffix));

  await Promise.all((keysToPurge.map((key) => localForage.removeItem(key))));
}

export async function withCache<T>(key: string, fn: () => Promise<T>, onFetch: (t: T, isFresh: boolean) => void) {
  cleanUpCache();

  const fullKey = `cache/${key}-${suffix}`;
  const {staleP, freshP} = {
    staleP: localForage.getItem<string>(fullKey).then((data) => data ? JSON.parse(data) : data),
    freshP: fn().then(async (data) => {
      await localForage.setItem(fullKey, JSON.stringify(data));
      return data;
    }),
  };
  const stale = await staleP;
  if (stale) onFetch(stale, false);
  onFetch(await freshP, true);
}
