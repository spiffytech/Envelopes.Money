import gql from 'graphql-tag';
import m from 'mithril';
import {
  assign,
  interpret,
  Interpreter,
  Machine,
  MachineConfig,
  matchesState,
  StateMachine,
} from 'xstate';

import { LayoutChildProps } from './Layout';

import { fragments } from '../lib/graphql_fragements';
type Hasura = Pick<LayoutChildProps, 'hasura'>['hasura'];

interface TransactionsSchema {
  states: {
    idle: {};
    configured: {
      states: {
        loading: {};
        error: {};
        ready: {};
      };
    };
  };
}

interface UrlParams {
  envelope: string | null;
  account: string | null;
  searchTerm: string | null;
  after: string | null;
}

type TransactionsEvent =
  | { type: 'configure'; urlParams: UrlParams }
  | { type: 'error'; error: any }
  | { type: 'ready'; transactions?: any[] };

interface TransactionsContext {
  error: any;
  hasura: Hasura;
  creds: Record<string, string>;
  urlParams: UrlParams;
  transactions: any[];
}

export default function Transactions(): m.Component<LayoutChildProps> {
  const machineDefinition: MachineConfig<
    TransactionsContext,
    TransactionsSchema,
    TransactionsEvent
  > = {
    id: 'transactions',
    initial: 'idle',
    states: {
      idle: {
        on: {
          configure: {
            target: 'configured',
            actions: assign((context, event) => ({
              ...context,
              urlParams: event.urlParams,
            })),
          },
        },
      },
      configured: {
        initial: 'loading',
        on: { configure: 'configured' },
        states: {
          loading: {
            entry: assign(context => ({
              ...context,
              transactions: [],
            })),
            on: {
              error: 'error',
              ready: {
                target: 'ready',
                actions: assign((context, event) => ({
                  ...context,
                  transactions: event.transactions,
                })),
              },
            },
          },
          error: {
            entry: assign((context, event) => ({
              ...context,
              error: (event as any).error,
            })),
          },
          ready: {
            on: {
              error: 'error',
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
              ({ data }) =>
                fireEvent({ type: 'ready', transactions: data.txns_grouped }),
              error => fireEvent({ type: 'error', error })
            );
            return unsubscribe;
          },
        },
      },
    },
  };

  let context: TransactionsContext | null = null;
  let service: Interpreter<
    TransactionsContext,
    TransactionsSchema,
    TransactionsEvent
  > | null = null;

  return {
    oninit({ attrs: { setTitle, hasura, creds } }) {
      setTitle('Transactions');

      const initialContext: TransactionsContext = {
        error: null,
        hasura,
        creds,
        urlParams: {
          account: null,
          envelope: null,
          searchTerm: null,
          after: null,
        },
        transactions: [],
      };

      const machine = Machine<
        TransactionsContext,
        TransactionsSchema,
        TransactionsEvent
      >(machineDefinition, {}, initialContext);
      service = interpret(machine);
      service.onChange(newContext => {
        context = newContext;
        m.redraw();
      });

      service.start();
      service.send({ type: 'configure', urlParams: m.route.param() });
    },

    view() {
      if (matchesState('configured.error', service!.state.value)) {
        return m('', 'Error loading transactions:', context!.error.message);
      }

      if (!matchesState('configured.ready', service!.state.value)) {
        return m('', 'Loading...');
      }

      return [
        context!.transactions.map(transaction =>
          m('', JSON.stringify(transaction))
        ),
      ];
    },
  };
}
