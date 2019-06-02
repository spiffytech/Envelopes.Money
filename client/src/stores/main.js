import {writable} from 'svelte/store';

import * as Balances from '../lib/Balances';
import * as TxnGrouped from '../lib/TxnGrouped';

export const store = writable({
    balances: [],
    txnsGrouped: [],
});

export const arrays = store;

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
    subscribeModule(graphql, TxnGrouped, 'txnsGrouped', 'txns_grouped');
    subscribeModule(graphql, Balances, 'balances', 'balances');
}