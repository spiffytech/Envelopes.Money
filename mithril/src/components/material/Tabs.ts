import classnames from 'classnames';
import m from 'mithril';

export interface TabsProps {
  tabs: { visual: m.FactoryComponent; url: string }[];
  active: string;
}

export default function Tabs(): m.Component<TabsProps> {
  return {
    view({ attrs: { tabs, active }, children }) {
      return m(
        'nav.w-full',
        m(
          'ul.flex.justify-center',
          ...tabs.map(tab =>
            m(
              m.route.Link,
              { style: { display: 'contents' }, href: tab.url },
              m(
                'li.px-4.py-2.border-black.flex-1.md:flex-none.flex.justify-center',
                {class: classnames({'border-b-2': tab.url === active})},
                m(tab.visual)
              )
            )
          )
        )
      );
    },
  };
}
