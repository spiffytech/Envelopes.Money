import React from "react";
import { BrowserRouter as Router, Route} from "react-router-dom";

import Account from './views/Account';
import Home from './views/Home';
import mkApollo from './lib/apollo';
import { StoreProvider, Store } from "./store";

const App: React.FC = () => {
  const store = new Store();
  const credsJSON = localStorage.getItem('creds');
  if (credsJSON) {
    const creds = JSON.parse(credsJSON);
    const graphql = {
      apollo: mkApollo(creds.apikey),
      userId: creds.userId,
      apikey: creds.apikey
    };
    store.subscribeAll(graphql)

    return (
      <StoreProvider value={store}>
        <Router>
          <div className="bg-gray-100">
            <Route path='/' component={Home} exact={true} />
            <Route path='/account/:accountId' component={Account} />
          </div>
        </Router>
      </StoreProvider>
    );
  } else {
    return <p>Not logged in</p>;
  }
};

export default App;
