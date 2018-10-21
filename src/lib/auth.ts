import * as auth0 from 'auth0-js';

export default class Auth {
  private auth0: auth0.WebAuth;
  
  public constructor() {
    if (!process.env.REACT_APP_AUTH0_DOMAIN) throw new Error('Missing process.env.REACT_APP_AUTH0_DOMAIN');
    if (!process.env.REACT_APP_AUTH0_CLIENTID) throw new Error('Missing process.env.REACT_APP_AUTH0_CLIENTID');

    this.auth0 = new auth0.WebAuth({
      domain: process.env.REACT_APP_AUTH0_DOMAIN,
      clientID: process.env.REACT_APP_AUTH0_CLIENTID,
      redirectUri: window.location.origin + '/auth0Callback',
      responseType: 'token id_token',
      scope: 'openid'
    });
  }

  /**
   * Redirects the user to Auth0 for login
   */
  public login() {
    this.auth0.authorize();
  }

  /**
   * Call this when Auth0 redirects to our callback URL. It processes query params.
   */
  public handleAuthentication() {
    return new Promise((resolve, reject) =>
      this.auth0.parseHash((err, authResult) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
          this.setSession(authResult);
          resolve(true)
        } else if (err) {
          console.error(err);
          resolve(false);
        }
        reject();
      }),
    );
  }

  public logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');

    this.auth0.logout({returnTo: window.location.origin});
  }

  public isAuthenticated() {
    // Check whether the current time is past the 
    // Access Token's expiry time
    const expiresValue = localStorage.getItem('expires_at');
    if (!expiresValue) return false;
    const expiresAt = JSON.parse(expiresValue);
    return new Date().getTime() < expiresAt;
  }

  public getToken() {
    return localStorage.getItem('access_token');
  }

  private setSession(authResult: any) {
    // Set the time that the Access Token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }
}
