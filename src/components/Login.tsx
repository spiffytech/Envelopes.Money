import {inject, observer} from 'mobx-react';
import * as React from 'react';
import {Redirect} from 'react-router-dom';
import store from '../store';

/* tslint:disable:no-console */

interface Props {store?: typeof store};

const initialState = {username: '', password: ''};
@inject((stores) => ({store: (stores as any).store as typeof store}))
@observer
export default class LoginForm extends React.Component<Props, typeof initialState> {
  public readonly state = initialState;

  public render() {
    if (this.props.store!.loggedIn) {
      console.log('You are logged in, redirecting to /');
      return <Redirect to="/" />
    }
		console.log('Showing login form');

    return (
      /* tslint:disable-next-line */
      <form onSubmit={this.handleSubmit.bind(this)}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="username"
            className="form-control"
            id="username"
            value={this.state.username}
            /* tslint:disable */
            onChange={(event: any) => this.setState({username: event.target.value})}
            /* tslint:enable */
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={this.state.password}
            /* tslint:disable */
            onChange={(event: any) => this.setState({password: event.target.value})}
            /* tslint:enable */
          />
        </div>

        <input type="submit" className="btn btn-primary" value="Log In" />
      </form>
    )
  }

  private async handleSubmit(event: any) {
    event.preventDefault();
    await this.props.store!.logIn(this.state.username, this.state.password);
    alert('Go to your username');
  }
}
