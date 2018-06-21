export function groupBy<T>(arr: T[], fn: (item: T) => string): {[key: string]: T[]} {
  return arr.reduce(
    (acc, item) => ({...acc, [fn(item)]: [...(acc[fn(item)] || []), item]}),
    {} as {[key: string]: T[]}
  )
}

export function objectFromEntries<T>(entries: [string, T][]): {[key: string]: T} {
  return entries.reduce((acc, [key, value]) => ({...acc, [key]: value}), {});
}