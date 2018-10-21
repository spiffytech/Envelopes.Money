import * as React from 'react';
import {BrowserRouter as Router, Redirect, Route, RouteComponentProps} from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';

import Auth0Callback from './views/Auth0Callback';
import LoggedIn from './views/LoggedIn';
import LogIn from './views/LogIn';

import Auth from './lib/auth';

const auth = new Auth();

type RouteComponent = React.StatelessComponent<RouteComponentProps<{}>> | React.ComponentClass<any>
function PrivateRoute(routeProps: {component?: RouteComponent, authed: boolean} & ReactRouterDom.RouteProps) {
  const {component: Component, children, authed, ...rest} = routeProps;
  return (
    <Route
      {...rest}
      render={
        /* tslint:disable-next-line:jsx-no-lambda */
        (props) => {
          if (!authed) return <Redirect to={{pathname: '/login', state: {from: props.location}}} />;
          if (Component) return <Component {...props} />;
          return children;
        }
      }
    />
  );
}

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
