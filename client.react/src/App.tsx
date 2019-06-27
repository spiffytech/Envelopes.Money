import React from "react";

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
        <div className="bg-gray-100">
          <Home />
        </div>
      </StoreProvider>
    );
  } else {
    return <p>Not logged in</p>;
  }
};

export default App;
