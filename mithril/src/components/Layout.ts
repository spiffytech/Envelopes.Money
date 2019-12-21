import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Debug from 'debug';
import m from 'mithril';

import Icon from './material/Icon';
import { TabsProps } from './material/Tabs';
import TopBar, {TopBarProps} from './material/TopBar';

import {endpoint} from  '../lib/config';
import mkClient from '../lib/graphql';

const debug = Debug('Envelopes.Money:Layout');

library.add(faEnvelope);
library.add(faDollarSign);

export interface LayoutChildProps {
  setTitle: (title: string) => void;
  hasura: ReturnType<typeof mkClient>;
}

interface LayoutProps {
  body: m.FactoryComponent<LayoutChildProps>;
}

async function loadCreds() {
  try {
    debug('Loading credentials');
    const response = await axios.get(`${endpoint}/api/credentials`, {
      withCredentials: true,
    });
    debug('Loaded credentials were %o', response.data);
    return response.data;
  } catch (ex) {
    if (ex.response && ex.response.status === 401) {
      debug('No credentials were loaded');
      return null;
    } else {
      throw new Error(`[loadCreds] ${ex.message}`);
    }
  }
}

const tabs: Pick<TabsProps, 'tabs'>['tabs'] = [
  {visual: m(Icon, {prefix: 'fas', icon: 'dollar-sign', size: 2}), url: '/transactions'},
  {visual: m(Icon, {prefix: 'far', icon: 'envelope', size: 2}), url: '/envelopes'},
]

export default function Layout(): m.Component<LayoutProps> {
  let title = '';
  let buttons: Pick<TopBarProps, 'buttons'>['buttons'] = [];
  let hasura: ReturnType<typeof mkClient> | null = null;
  let error: string | null = null;

  return {
    async oninit() {
      console.log(window._env_)
      try {
        const creds = await loadCreds();

        hasura = mkClient(window._env_.GRAPHQL_WSS_HOST as string, {
          reconnect: true,
          connectionParams: {
            headers: {
              Authorization: `Bearer ${creds.apikey}`,
            },
          },
        });
      } catch (ex) {
        error = ex.message;
      } finally {
        m.redraw();
      }
    },

    view({attrs: {body}}) {
      if (error) return m('p', error);

      if (!hasura) return m('p', 'Loading...');

      return [
        m(TopBar, {title, buttons, tabs: {tabs, active: ''}}),
        m(body, {setTitle: (newTitle) => {title = newTitle; m.redraw();}, hasura})
      ];
    }
  };
}