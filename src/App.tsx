import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery';
import {toJS} from 'mobx';
import {Provider} from 'mobx-react';
import * as React from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import 'typeface-roboto'
import './App.css';
import Login from './components/Login';
import Nav from './components/Nav';
import store from './store';

(window as any).store = store;
(window as any).toJS = toJS;

class App extends React.Component {
  public render() {
    return (
      <BrowserRouter>
        <Provider store={store}>
          <div>
            <Nav />
            <Route exact={true} path="/login" component={Login} />
          </div>
        </Provider>
      </BrowserRouter>
    )
  }
}

export default App;
