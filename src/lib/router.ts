import page from 'page';
import Store from '../store';

/* tslint:disable:no-console */

export default function initRouter(store: typeof Store) {
  page('/login', () => store.showLogin());
  page('/editTxn/:txnId', ({params}) => store.showEditTxn(params.txnId));
  page('/', () => store.showHome());
  page('*', () => alert('Page not found'));
  page();
}

export function pushRoute(route: string) {
  window.history.pushState(null, undefined, route)
}
