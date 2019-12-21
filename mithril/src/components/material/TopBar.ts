import m from 'mithril';

import Tabs, { TabsProps } from './Tabs';

export interface TopBarProps {
  title: string;
  buttons: m.FactoryComponent[];
  tabs?: TabsProps;
}

export default function TopBar(): m.Component<TopBarProps> {
  return {
    view({ attrs, children }) {
      return [
        m(
          '.bg-orange-500',
          m(
            '.flex.items-center.p-4.justify-between',
            { style: 'height: 56px;' },
            m('span.text-lg.font-medium', attrs.title),
            m(
              '.flex',
              ...(attrs.buttons || []).slice(0, 2).map(button => m('.px-4', m(button)))
            )
          ),
          attrs.tabs ? m(Tabs, attrs.tabs) : null
        ),
        children,
      ];
    },
  };
}
