import {inject, observer} from 'mobx-react';
import * as React from 'react';
import {BrowserRouter as Router, Redirect, Route, RouteComponentProps} from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';

import Store from './store';

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

@inject('store')
@observer
class App extends React.Component<{store?: Store}> {
  public render() {
    return (
      <>
        <nav className='navbar' role='navigation' aria-label='main navigation'>
          <div className='navbar-brand'>
            <a className='navbar-item' href='/'>HackerBudget</a>
          </div>
        </nav>
        <section className='section'>
          <Router>
            <PrivateRoute exact={true} path='/' authed={true}>
              <div className='container'>
                <table>
                  <tbody>
                    {this.props.store!.transactionsByDate.map((txn) =>(
                      <tr key={txn.id}>
                        <td>{txn.date.toJSON()}</td>
                        <td>{txn.payee}</td>
                        <td>{txn.from.name} ⇨ {txn.to.map((to) => to.bucket.name).join(', ')}</td>
                        <td>{txn.memo}</td>
                        <td>{txn.amount.dollars}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PrivateRoute>
          </Router>
        </section>
      </>
    );
  }
}

export default App;
