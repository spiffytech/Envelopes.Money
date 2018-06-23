import TextField from '@material-ui/core/TextField';
import {inject, observer} from 'mobx-react';
import * as React from 'react';
import {Redirect} from 'react-router-dom';
import store from '../store';

interface Props {store?: typeof store};

const initialState = {email: ''};
@inject((stores) => ({store: (stores as any).store as typeof store}))
@observer
export default class LoginForm extends React.Component<Props, typeof initialState> {
  public readonly state = initialState;

  constructor(props: Props) {
    super(props);
    store.tryFinishLogIn();
  }

  public render() {
    if (this.props.store!.loggedIn) {
      return <Redirect to="/" />
    }

    return (
      /* tslint:disable-next-line */
      <form onSubmit={this.handleSubmit.bind(this)}>
        <TextField
          label="Email"
          value={this.state.email}
          /* tslint:disable */
          onChange={(event) => this.setState({email: event.target.value})}
          /* tslint:enable */
        />

        <input type="submit" value="Log In" />
      </form>
    )
  }

  private async handleSubmit(event: any) {
    event.preventDefault();
    await this.props.store!.logIn({email: this.state.email});
    alert('Go to your email');
  }
}
