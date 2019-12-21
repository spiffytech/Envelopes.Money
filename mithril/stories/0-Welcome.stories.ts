import m from 'mithril';
import { withKnobs, text } from '@storybook/addon-knobs';

import Tabs, {TabsProps} from '../src/components/material/Tabs';
import TopBar from '../src/components/material/TopBar';
import '../public/tailwind.css';

export default {
  title: 'Material Components',
  decorators: [withKnobs]
};

export function TopBarStory() {
  function button1() {
    return {
      view() {
        return m('button', 'Button1');
      }
    }
  }
  function button2() {
    return {
      view() {
        return m('button', 'Button2');
      }
    }
  }

  const textTabs: Pick<TabsProps, 'tabs'>['tabs'] = [
    {url: '/1', visual: () => ({view: () => m('', 'Tab 1')})},
    {url: '/2', visual: () => ({view: () => m('', 'Tab 2')})}
  ];

  return {
    view() {
      return m('',
        m('heading', 'A plain TopBar'),
        m(TopBar, {title: 'TopBar Demo', buttons: [button1, button2]}, m('p', 'A child')),

        m('heading', 'A TopBar with tabs'),
        m(TopBar, {title: 'TopBar with Tabs', buttons: [button1, button2], tabs: {tabs: textTabs, active: '/1'}}, m('p', 'A child'))
      );
    }
  };
}
TopBarStory.story = {
  name: 'TopBar',
};


export function TabsStory() {
  const textTabs: Pick<TabsProps, 'tabs'>['tabs'] = [
    {url: '/1', visual: () => ({view: () => m('', 'Tab 1')})},
    {url: '/2', visual: () => ({view: () => m('', 'Tab 2')})}
  ];
  return {
    view() {
      return m(Tabs, {tabs: textTabs, active: text('Active', '/1')});
    }
  }
}
TabsStory.story = {
    name: 'Tabs'
}