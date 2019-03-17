import {observable} from 'mobx';

interface CredentialsEmpty {loggedIn: false; userId: null; apiKey: null}
interface CredentialsFilled {loggedIn: true; userId: string; apiKey: string}
type Credentials = CredentialsEmpty | CredentialsFilled;

export const AuthStore: Credentials = observable({
  loggedIn: false as false,
  userId: null,
  apiKey: null,
});
