import localForage from 'localforage';

export async function cache(key: string, data: any) {
  await localForage.setItem(key, JSON.stringify(data));
  return;
}

export function withCache<T>(key: string, fn: () => Promise<T>): {stale: Promise<T|null>, fresh: Promise<T>} {
  const fullKey = `cache/${key}`;
  return {
    stale: localForage.getItem<string>(fullKey).then((data) => data ? JSON.parse(data) : data),
    fresh: fn().then(async (data) => {
      await localForage.setItem(fullKey, JSON.stringify(data));
      return data;
    }),
  }
}
