import * as React from 'react';
import {Redirect} from 'react-router-dom';

import Auth from '../lib/auth';

export default class Auth0Callback extends React.Component {
  public state = {
    isAuthed: null,
  }

  public async componentWillMount() {
    console.log('authing')
    const auth = new Auth();
    const isAuthed = await auth.handleAuthentication();
    console.log('Is authed', isAuthed)
    this.setState({isAuthed});
  }

  public render() {
    if (this.state.isAuthed === null) return <p>Authorizing...</p>;
    if (this.state.isAuthed) return <Redirect to={{pathname: '/'}} />;
    return <Redirect to={{pathname: '/login'}} />;
  }
}
