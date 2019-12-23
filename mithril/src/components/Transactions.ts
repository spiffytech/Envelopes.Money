import gql from 'graphql-tag';
import isEqual from 'lodash/isEqual';
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
    loading: {};
    error: {};
    firstPage: {};
    nthPage: {};
    lastPage: {};
  };
}

interface UrlParams {
  envelope: string | null;
  account: string | null;
  searchTerm: string | null;
  pageNum: number;
}

type TransactionsEvent =
  | { type: 'configure'; urlParams: UrlParams }
  | { type: 'error'; error: any }
  | { type: 'dataReceived'; transactions?: any[]; hasNextPage: boolean };

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
    initial: 'loading',
    on: {
      configure: 'loading',
      error: 'error',
      dataReceived: [
        {
          cond: 'isFirstPage',
          internal: true,
          target: 'firstPage',
          actions: 'storeData',
        },
        {
          cond: 'isLastPage',
          internal: true,
          target: 'lastPage',
          actions: 'storeData',
        },
        {
          target: 'nthPage',
          internal: true,
          actions: 'storeData',
        },
      ],
    },
    states: {
      loading: {
        entry: 'setUrlParams',
      },
      error: {
        entry: 'storeError',
      },
      firstPage: {},
      nthPage: {},
      lastPage: {},
    },
    invoke: {
      src: 'subscribeData',
    },
  };

  let context: TransactionsContext | null = null;
  let service: Interpreter<
    TransactionsContext,
    TransactionsSchema,
    TransactionsEvent
  > | null = null;

  function getUrlParams(): UrlParams {
    return {
      account: m.route.param('account'),
      envelope: m.route.param('envelope'),
      searchTerm: m.route.param('searchTerm'),
      pageNum: parseInt(m.route.param('pageNum') || '0'),
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
        urlParams,
        transactions: [],
      };

      const machine = Machine<
        TransactionsContext,
        TransactionsSchema,
        TransactionsEvent
      >(
        machineDefinition,
        {
          actions: {
            storeData: assign((context, event) => ({
              ...context,
              transactions: (event as any).transactions,
            })),

            setUrlParams: assign((context, event) => ({
              ...context,
              transactions: [],
              // Spread the old urlParams so we don't wipe out the initial
              // URLparams (since we default to this state and there's no event
              // with params to spread from)
              urlParams: { ...context.urlParams, ...(event as any).urlParams },
            })),

            storeError: assign((context, event) => ({
              ...context,
              error: (event as any).error,
            })),
          },

          guards: {
            isFirstPage: context => context.urlParams.pageNum === 0,
            isLastPage: (_context, event) => !(event as any).hasNextPage,
          },

          services: {
            subscribeData: ({
              hasura,
              creds,
              urlParams: { pageNum },
            }) => fireEvent => {
              console.log('invoking');
              const limit = 50;
              const offset = pageNum * limit;
              try {
                const { unsubscribe } = hasura.subscribe(
                  {
                    query: gql`
                      ${fragments}
                      subscription SubscribeTransactions(
                        $user_id: String!
                        $limit: Int!
                        $offset: Int!
                      ) {
                        txns_grouped(
                          where: { user_id: { _eq: $user_id } }
                          order_by: { date: desc, txn_id: asc }
                          limit: $limit
                          offset: $offset
                        ) {
                          ...txn_grouped
                        }
                      }
                    `,
                    variables: {
                      user_id: creds.userId,
                      limit: limit + 1,
                      offset,
                    },
                  },
                  ({ data }) => {
                    const hasNextPage = data.txns_grouped.length === limit + 1;
                    return fireEvent({
                      type: 'dataReceived',
                      transactions: data.txns_grouped,
                      hasNextPage,
                    });
                  },
                  error => fireEvent({ type: 'error', error })
                );
                return () => {
                  unsubscribe();
                };
              } catch (ex) {
                fireEvent({ type: 'error', error: ex });
              }
            },
          },
        },
        initialContext
      );
      service = interpret(machine);
      service.onChange(newContext => {
        context = newContext;
        m.redraw();
      });

      service.start();
    },

    onupdate() {
      const newUrlParams = getUrlParams();
      if (!isEqual(urlParams, newUrlParams)) {
        service!.send({ type: 'configure', urlParams: newUrlParams });
      }
      urlParams = newUrlParams;
    },

    view() {
      if (matchesState('error', service!.state.value)) {
        return m('', 'Error loading transactions:', context!.error.message);
      }

      if (matchesState('loading', service!.state.value)) {
        return m('', 'Loading...');
      }

      return [
        matchesState('firstPage', service!.state.value)
          ? m('span', 'Previous')
          : m(
              m.route.Link,
              {
                href: `/transactions?${m.buildQueryString({
                  ...(context!.urlParams as any),
                  pageNum: Math.max(0, context!.urlParams.pageNum - 1),
                })}`,
              },
              'Previous'
            ),
        matchesState('lastPage', service!.state.value)
          ? m('span', 'Next')
          : m(
              m.route.Link,
              {
                href: `/transactions?${m.buildQueryString({
                  ...(context!.urlParams as any),
                  pageNum: context!.urlParams.pageNum + 1,
                })}`,
              },
              'Next'
            ),
        context!.transactions.map(transaction =>
          m('', JSON.stringify(transaction))
        ),
      ];
    },

    onremove() {
      service?.stop();
    },
  };
}
