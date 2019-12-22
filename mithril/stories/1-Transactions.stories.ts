import m from 'mithril';

import Layout from '../src/components/Layout';
import Transactions from '../src/components/Transactions';

export default {
  title: 'Transactions',
};

export function TransactionsStory(): m.Component {
  let el: Element | null = null;
  return {
    oncreate(vnode) {
      el = vnode.dom;
      m.route(el, '/transactions', {
        '/transactions': {
          render() {
            return m(Layout, { body: Transactions });
          },
        },
      });
    },

    view() {
      return m('');
    },

    onremove() {
      el && m.mount(el, null);
    }
  };
}
TransactionsStory.story = {
  title: Transactions,
};
