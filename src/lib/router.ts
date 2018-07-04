import page from 'page';
import Store from '../store';

/* tslint:disable:no-console */

export default function initRouter(store: typeof Store) {
  page('/', () => store.showHome())
  page('/login', () => store.showLogin())
  page();
}

export function pushRoute(route: string) {
  window.history.pushState(null, undefined, route)
}
