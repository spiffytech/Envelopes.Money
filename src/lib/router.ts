/* tslint:disable-next-line:no-var-requires */
import page from 'page';
import Store from '../store';
/* tslint:disable:no-console */
/* tslint:disable-next-line:no-var-requires */
console.log(require('director'));

export default function initRouter(store: typeof Store) {
  page('/', () => store.showHome())
  page('/login', () => store.showLogin())
}