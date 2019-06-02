import {writable} from 'svelte/store';

import * as TxnGrouped from '../lib/TxnGrouped';

export const store = writable({
    txnsGrouped: [],
});

export function subscribe(graphql) {
    TxnGrouped.subscribeTransactions(
        graphql,
        ({data}) => {
            store.update(($store) => ({
                ...$store,
                txnsGrouped: data.txns_grouped,
            }));
        }
    );
}