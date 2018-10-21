import * as React from 'react';

import Auth from '../lib/auth';

export default class LogIn extends React.Component {
  public render() {
    const auth = new Auth();
    auth.login();
    return <p>Logging in...</p>;
  }
}
