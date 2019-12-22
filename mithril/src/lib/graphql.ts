import {
  SubscriptionClient,
  ClientOptions,
  OperationOptions,
} from 'subscriptions-transport-ws';

export interface WSClient {
  client: SubscriptionClient;
  subscribe: (query: OperationOptions, onData: (value: {data?: any}) => void) => ReturnType<typeof subscribe>;
  query: (query: OperationOptions) => Promise<{data?: any}>;
}

function subscribe(
  client: SubscriptionClient,
  query: OperationOptions,
  onData: (value: {data?: any}) => void,
  // eslint-disable-next-line no-console
  onError = console.error
) {
  return client.request(query).subscribe({ next: onData, error: onError });
}

function request(
  client: SubscriptionClient,
  query: OperationOptions
): Promise<{data?: any}> {
  return new Promise((resolve, reject): void => {
    const {unsubscribe} = client.request(query).subscribe({
      next: result => {
        unsubscribe();
        if (result.errors) return reject(result.errors);
        return resolve(result);
      },
      error: reject,
    });
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function mkClient(url: string, options: ClientOptions): WSClient {
  const client = new SubscriptionClient(url, options);
  return {
    client,
    subscribe: subscribe.bind(null, client),
    query: request.bind(null, client),
  };
}
