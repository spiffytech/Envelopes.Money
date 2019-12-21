import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlus, faDollarSign, faChartLine, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import { withKnobs, text } from '@storybook/addon-knobs';
import m from 'mithril';

import Icon from '../src/components/material/Icon';
import Tabs, {TabsProps} from '../src/components/material/Tabs';
import TopBar from '../src/components/material/TopBar';
import '../public/tailwind.css';

library.add(faPlus);
library.add(faDollarSign);
library.add(faChartLine);
library.add(faUserAlt);

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
    {url: '/1', visual: m('', 'Tab 1')},
    {url: '/2', visual: m('', 'Tab 2')}
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
    {url: '/1', visual: m('', 'Tab 1')},
    {url: '/2', visual: m('', 'Tab 2')}
  ];

  const iconTabs: Pick<TabsProps, 'tabs'>['tabs'] = [
    {url: '/1', visual: m(Icon, {prefix: 'fas', icon: 'dollar-sign'})},
    {url: '/2', visual: m(Icon, {prefix: 'fas', icon: 'chart-line'})}
  ];
  return {
    view() {
      return [
        m(Tabs, {tabs: textTabs, active: text('Active', '/1')}),
        m(Tabs, {tabs: iconTabs, active: text('Active', '/1')}),
      ];
    }
  }
}
TabsStory.story = {
    name: 'Tabs'
}

export function IconStory() {
  return {
    view() {
      return [
        m('header', 'FontAwesome'),
        m(Icon, {prefix: 'fas', icon: 'user-alt'}),
        m(Icon, {prefix: 'fas', icon: 'dollar-sign'}),
        m(Icon, {prefix: 'fas', icon: 'plus'}),
        m(Icon, {prefix: 'fas', icon: 'chart-line'}),

        m('header', 'Larger icons'),
        m(Icon, {prefix: 'fas', icon: 'user-alt', size: 2}),
        m(Icon, {prefix: 'fas', icon: 'dollar-sign', size: 2}),
        m(Icon, {prefix: 'fas', icon: 'plus', size: 2}),
        m(Icon, {prefix: 'fas', icon: 'chart-line', size: 2}),
      ];
    }
  };
}
IconStory.story = {
  name: 'Icons'
}