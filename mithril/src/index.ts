import m from "mithril";

import Transactions from './components/Transactions';

m.route(document.body, '/transactions', {
  '/transactions': Transactions
});
