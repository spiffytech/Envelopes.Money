import gql from 'graphql-tag';
import m from 'mithril';
import { assign, interpret, Machine } from 'xstate';

import { LayoutChildProps } from './Layout';

import { fragments } from '../lib/graphql_fragements';
type Hasura = Pick<LayoutChildProps, 'hasura'>['hasura'];

interface TransactionsSchema {
  states: {
    idle: {};
    unconfigured: {};
    configured: {
      states: {
        loading: {};
        ready: {};
      };
    };
  };
}

type TransactionsEvent =
  | { type: 'initialize'; hasura: Hasura; creds: any }
  | { type: 'configure' }
  | { type: 'ready'; transactions?: any[] };

interface TransactionsContext {
  loaded: boolean;
  hasura: Hasura | null;
  urlParams: {
    envelope: string | null;
    account: string | null;
    searchTerm: string | null;
  };
  transactions: any[];
}

export default function Transactions(): m.Component<LayoutChildProps> {
  const machine = Machine<
    TransactionsContext,
    TransactionsSchema,
    TransactionsEvent
  >({
    id: 'transactions',
    initial: 'idle',
    context: {
      loaded: false,
      hasura: null,
      urlParams: { envelope: null, account: null, searchTerm: null },
      transactions: [],
    },
    states: {
      idle: {
        on: {
          initialize: {
            target: 'unconfigured',
            actions: assign((context, event) => ({
              ...context,
              hasura: event.hasura,
              creds: event.creds,
            })),
          },
        },
      },
      unconfigured: {
        invoke: {
          src: () => Promise.resolve(m.route.param()),
          onDone: {
            target: 'configured',
            actions: assign((context, event) => ({
              ...context,
              urlParams: event.data,
            })),
          },
        },
      },
      configured: {
        initial: 'loading',
        on: { configure: 'unconfigured' },
        states: {
          loading: {
            entry: assign(context => ({
              ...context,
              loaded: false,
              transactions: [],
            })),
            on: {
              ready: {
                target: 'ready',
                actions: assign((context, event) => ({
                  ...context,
                  transactions: event.transactions,
                  loaded: true,
                })),
              },
            },
          },
          ready: {
            on: {
              ready: {
                target: 'ready',
                actions: assign((context, event) => ({
                  ...context,
                  transactions: event.transactions,
                })),
              },
            },
          },
        },
        invoke: {
          src: ({
            hasura,
            creds,
          }: {
            hasura: Hasura;
            creds: any;
          }) => fireEvent => {
            const { unsubscribe } = hasura.subscribe(
              {
                query: gql`
                  ${fragments}
                  subscription SubscribeTransactions(
                    $user_id: String!
                    $date: date
                    $txn_id: String
                  ) {
                    txns_grouped(
                      where: {
                        _or: { date: { _lte: $date } }
                        _and: { date: { _lt: $date }, txn_id: { _lt: $txn_id } }
                      }
                      order_by: { date: desc, txn_id: asc }
                      limit: 50
                    ) {
                      ...txn_grouped
                    }
                  }
                `,
                variables: { user_id: creds.userId },
              },
              ({ data }) => {
                fireEvent({ type: 'ready', transactions: data.txns_grouped });
              }
            );
            return unsubscribe;
          },
        },
      },
    },
  });

  let context: TransactionsContext = {
    loaded: false,
    hasura: null,
    urlParams: {
      account: null,
      envelope: null,
      searchTerm: null,
    },
    transactions: [],
  };
  const service = interpret(machine);
  service.onChange(newContext => {
    context = newContext;
    m.redraw();
  });

  return {
    oninit({ attrs: { setTitle, hasura, creds } }) {
      setTitle('Transactions');
      service.start();
      service.send('initialize', { hasura, creds });
    },

    view() {
      if (!context.loaded) {
        return m('', 'Loading...');
      }

      return [
        context.transactions.map(transaction =>
          m('', JSON.stringify(transaction))
        ),
      ];
    },
  };
}
