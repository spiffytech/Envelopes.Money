import localForage from 'localforage';

export async function cache(key: string, data: any) {
  await localForage.setItem(key, JSON.stringify(data));
  return;
}

export async function withCache<T>(key: string, fn: () => Promise<T>, onFetch: (t: T, isFresh: boolean) => void) {
  const fullKey = `cache/${key}`;
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
