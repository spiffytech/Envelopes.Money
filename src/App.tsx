import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery';
import {toJS} from 'mobx';
import {observer} from 'mobx-react';
import * as React from 'react';
import 'typeface-roboto'
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Nav from './components/Nav';
import initRouter from './lib/router';
import Store from './store';

(window as any).store = Store;
(window as any).toJS = toJS;

initRouter(Store);

function renderCurrentView(store: typeof Store) {
  const viewName = store.currentView.name;
  switch (viewName) {
    case 'home': return <Home store={store} />
    case 'login': return <Login store={store} />
    default:
      const n: never = viewName;
      return n;
  }
}

function AppComponent({store}: {store: typeof Store}) {
  return (
    <>
      <Nav store={store} />
      {renderCurrentView(store)}
    </>
  )
}
const App = observer(AppComponent);

export default App;
