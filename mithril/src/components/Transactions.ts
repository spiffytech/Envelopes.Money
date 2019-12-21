import m from 'mithril';

import TopBar from './material/TopBar';

export default function Transactions(): m.Component {
  return {
    view() {
      return m('', 'transactions', m(TopBar));
    }
  }
}