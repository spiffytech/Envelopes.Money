import fromPairs from 'ramda/es/fromPairs';

export default async function loadBalances(db) {
  const {rows} = await db.query('balances/balances', {group: true, reduce: true});
  return fromPairs(rows.map(row => [row.key, row.value]));
}
