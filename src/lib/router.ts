import page from 'page';
import Store from '../store';

export default function initRouter(store: typeof Store) {
  page('/', () => store.showHome())
  page('/login', () => store.showLogin())
}

export function pushRoute(route: string) {
  window.history.pushState(null, undefined, route)
}