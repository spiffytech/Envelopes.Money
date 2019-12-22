import gql from 'graphql-tag';
import m from 'mithril';
import {
  assign,
  interpret,
  Interpreter,
  Machine,
  MachineConfig,
  matchesState,
} from 'xstate';

import { LayoutChildProps } from './Layout';

import { fragments } from '../lib/graphql_fragements';
type Hasura = Pick<LayoutChildProps, 'hasura'>['hasura'];

interface TransactionsSchema {
  states: {
    configured: {
      states: {
        loading: {};
        error: {};
        ready: {};
      };
    };
  };
}

interface AfterParams {date: string; txn_id: string;}

interface UrlParams {
  envelope: string | null;
  account: string | null;
  searchTerm: string | null;
  after: AfterParams | null;
}

type TransactionsEvent =
  | { type: 'configure'; urlParams: UrlParams }
  | { type: 'error'; error: any }
  | { type: 'ready'; transactions?: any[], after: AfterParams};

interface TransactionsContext {
  error: any;
  hasura: Hasura;
  creds: Record<string, string>;
  after: AfterParams | null;
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
    initial: 'configured',
    states: {
      configured: {
        initial: 'loading',
        on: { configure: 'configured' },
        states: {
          loading: {
            entry: assign((context, event) => ({
              ...context,
              transactions: [],
              urlParams: (event as any).urlParams,
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
            const limit = 50;
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
                      limit: ${limit}
                    ) {
                      ...txn_grouped
                    }
                  }
                `,
                variables: { user_id: creds.userId },
              },
              ({ data }) => {
                const last = data.txns_grouped[data.txns_grouped.length - 1];
                const after: AfterParams | null = data.txns_grouped.length === limit ? {date: last.date, txn_id: last.txn_id} : null;
                return fireEvent({ type: 'ready', transactions: data.txns_grouped, after });
              },
              error => fireEvent({ type: 'error', error })
            );
            return () => {
              unsubscribe();
            }
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

  function getUrlParams(): UrlParams {
    return  {
      account: m.route.param('account'),
      envelope: m.route.param('envelope'),
      searchTerm: m.route.param('searchTerm'),
      after: m.route.param('after') as any,
    };
  }

  let urlParams = getUrlParams();

  return {
    oninit({ attrs: { setTitle, hasura, creds } }) {
      setTitle('Transactions');

      const initialContext: TransactionsContext = {
        error: null,
        hasura,
        creds,
        after: null,
        urlParams,
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
      //service.send({ type: 'configure', urlParams: m.route.param() });
    },

    onupdate() {
      const newUrlParams = getUrlParams();
    },

    view() {
      if (matchesState('configured.error', service!.state.value)) {
        return m('', 'Error loading transactions:', context!.error.message);
      }

      if (!matchesState('configured.ready', service!.state.value)) {
        return m('', 'Loading...');
      }

      return [
        m(m.route.Link, {href: '/stuff'}, 'A Link'),
        context!.transactions.map(transaction =>
          m('', JSON.stringify(transaction))
        ),
      ];
    },

    onremove() {
      service?.stop();
    }
  };
}
