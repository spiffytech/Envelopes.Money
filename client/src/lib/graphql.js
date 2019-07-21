import {SubscriptionClient} from 'subscriptions-transport-ws';

function subscribe(client, query, onData, onError=console.error) {
    client.request(query).subscribe({next: onData, error: onError});
}

function query(client, query) {
    return new Promise((resolve, reject) => {
        client.request(query).subscribe({next: resolve, error: reject});
    })
}

export function mkClient(url, options) {
    const client = new SubscriptionClient(url, options);
    return {
        client,
        subscribe: subscribe.bind(null, client),
        query: query.bind(null, client)
    };
}
