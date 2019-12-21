import m from 'mithril';

import { LayoutChildProps } from './Layout';

export default function Transactions(): m.Component<LayoutChildProps> {
  return {
    oninit({attrs: {setTitle}}) {
      setTitle('Transactions');
    },

    view() {
      return m('', 'transactions');
    },
  };
}
