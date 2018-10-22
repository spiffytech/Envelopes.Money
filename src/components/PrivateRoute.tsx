import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import {Redirect, Route, RouteComponentProps} from 'react-router-dom'

type RouteComponent = React.StatelessComponent<RouteComponentProps<{}>> | React.ComponentClass<any>
export default function PrivateRoute(routeProps: {component?: RouteComponent, authed: boolean} & ReactRouterDom.RouteProps) {
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

