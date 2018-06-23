import {inject, observer} from 'mobx-react';
import * as React from 'react';
import {Link} from 'react-router-dom';
import store from '../store';

interface Props {store?: typeof store};

const initialState = {email: ''};
@inject((stores) => ({store: (stores as any).store as typeof store}))
@observer
export default class LogInLogOut extends React.Component<Props, typeof initialState> {
    public render() {
        if (this.props.store!.loggedIn) {
            return <button onClick={this.props.store!.logOut}>Log Out</button>;
        } else {
            return <Link to="/login">Log In</Link>;
        }
    }
}