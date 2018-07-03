import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery';
import {toJS} from 'mobx';
import {inject, observer, Provider} from 'mobx-react';
import * as React from 'react';
import {RouteComponentProps, RouteProps} from 'react-router';
import {BrowserRouter, Redirect, Route, Switch, withRouter} from 'react-router-dom';
import 'typeface-roboto'
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Nav from './components/Nav';
import Store from './store';

(window as any).store = Store;
(window as any).toJS = toJS;

/* tslint:disable:jsx-no-lambda */

/*
const ProtectedRouteComponent: React.StatelessComponent<{store?: typeof Store, [key: string]: any}> = ({store, component: Component, ...props}) => {
  return (
    <Route
      {...props}
      render={rProps => (
        store!.loggedIn ?
          <Component {...props} /> :
          <Redirect to="/login" />
      )}
    />
  );
}

const ProtectedRoute = inject((stores) => ({store: (stores as any).store as typeof Store}))(
  observer(
    ProtectedRouteComponent
  )
);
*/

const W = (props: any) => {
  return <div>{JSON.stringify(props)}</div>
}
const W2 = withRouter(props => <W {...props} />);

function ProtectedRouteComponent({store, component: Component, ...rest}: {store?: typeof Store} & RouteProps & RouteComponentProps<any, any>) {
  if (!Component) throw new Error('Component was undefined');

  /* tslint:disable:no-console */
  console.log(store!.loggedIn);
  return (
    <Route 
      {...rest} 
      /* tslint:disable-next-line:jsx-no-lambda */
      render={componentProps => (
        store!.loggedIn ?
          <Component {...componentProps} /> :
          <Redirect to='/login' />
      )} 
    />
  )
}
const ProtectedRoute = withRouter(
  inject((stores) => ({store: (stores as any).store as typeof Store}))(
    observer(
      ProtectedRouteComponent
    )
  )
);

const NavigationComponent: React.StatelessComponent<{store?: typeof Store}> = ({store}) => {
  return (
    <>
      <Nav />
      <W2 />
      <Switch>
        <Route exact={true} path="/login" component={withRouter((props) => <Login {...props} />)} />
				<ProtectedRoute exact={true} path="" component={Home} />
				<ProtectedRoute exact={true} path="/" component={Home} />
				<Route render={() => <div>404</div>} />
      </Switch>
    </>
  )
}

const Navigation = inject((stores) => ({store: (stores as any).store as typeof Store}))(
  observer(
    NavigationComponent
  )
);

/* tslint:disable-next-line:max-classes-per-file */
class App extends React.Component {
  public render() {
    return (
      <BrowserRouter>
        <Provider store={Store}>
          <Navigation />
        </Provider>
      </BrowserRouter>
    )
  }
}

export default App;
