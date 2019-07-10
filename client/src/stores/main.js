import {derived, writable} from 'svelte/store';

import * as Balances from '../lib/Balances';
import * as TxnGrouped from '../lib/TxnGrouped';

export const store = writable({
    balances: [],
    searchTerm: '',
    txnsGrouped: [],
});

export const arrays = derived(
    store,
    ($store) => ({
        ...$store,
        txnsGrouped: $store.txnsGrouped.filter((txnGrouped) =>
            (txnGrouped.label || '').toLowerCase().includes($store.searchTerm) ||
            (txnGrouped.memo || '').toLowerCase().includes($store.searchTerm) ||
            txnGrouped.from_name.toLowerCase().includes($store.searchTerm) ||
            txnGrouped.to_names.toLowerCase().includes($store.searchTerm) ||
            (txnGrouped.amount / 100).toFixed(2).includes($store.searchTerm)
        ),
    })
);

/**
 * Subscribes to a given module's data set, updating the supplied store key on
 * every update
 */
function subscribeModule(graphql, module, storeKey, dataKey) {
    module.subscribe(
        graphql,
        ({data}) => {
            store.update(($store) => ({
                ...$store,
                [storeKey]: data[dataKey],
            }));
        }
    );
}

export function subscribe(graphql) {
    window.dostuff = () => Balances.subscribe(graphql, console.log);
    subscribeModule(graphql, TxnGrouped, 'txnsGrouped', 'txns_grouped');
    subscribeModule(graphql, Balances, 'balances', 'balances');
}

store.subscribe(console.log);