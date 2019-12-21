import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faPlus, faDollarSign, faChartLine, faArrowRight, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import m from "mithril";

import Transactions from './components/Transactions';

library.add(faEnvelope);
library.add(faPlus);
library.add(faDollarSign);
library.add(faChartLine);
library.add(faArrowRight);
library.add(faUserAlt);

m.route(document.body, '/transactions', {
  '/transactions': Transactions
});
