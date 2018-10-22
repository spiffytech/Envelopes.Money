import * as React from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';
import Auth0Callback from './views/Auth0Callback';
import LoggedIn from './views/LoggedIn';
import LogIn from './views/LogIn';

import Auth from './lib/auth';

const auth = new Auth();

class App extends React.Component {
  public render() {
    return (
      <Router>
        <>
            <Route exact={true} path='/login' component={LogIn} />
            <Route exact={true} path='/auth0Callback' component={Auth0Callback} />

            <PrivateRoute exact={true} path='/' authed={auth.isAuthenticated()} component={LoggedIn} />
        </>
      </Router>
    );
  }
}

export default App;
