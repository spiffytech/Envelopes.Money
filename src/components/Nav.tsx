import * as React from 'react';
import LogInLogOut from './LogInLogOut';


export default function Nav() {
  return (
    <nav className="navbar navbar-expand-sm navbar-light bg-light">
      <a className="navbar-brand" href="/">Hacker Budget</a>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse">
        <span className="ml-auto"><LogInLogOut /></span>
      </div>
    </nav>
  );
}