import m from 'mithril';

import Layout from '../src/components/Layout';
import Transactions from '../src/components/Transactions';

export default {
  title: 'Transactions',
};

export function TransactionsStory() {
  return {
    view() {
      return m(Layout, {body: Transactions});
    }
  };
}
TransactionsStory.story = {
  title: Transactions
};