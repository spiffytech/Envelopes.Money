import axios from 'axios';
import {RouteComponentProps} from 'react-router-dom';
import React, {useState} from 'react';

import {AuthStore} from '../store';
import {endpoint} from '../lib/config';

function LogIn(props: RouteComponentProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await axios.post(`${endpoint}/login`, {email: username, password});
      setError(null);
      AuthStore.loggedIn = true;
      AuthStore.userId = response.data.userId;
      AuthStore.apiKey = response.data.apikey;
      props.history.push('/');
    } catch (ex) {
      setError(ex.response.data.error);
    }
  }

  const style: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    border: '2px solid #e1e1e1',
    margin: '24px',
  }

  return (
    <>
      {error ? <p>{error}</p> : null}
      <form style={style} onSubmit={handleSubmit}>
        <header style={{fontWeight: 'bold'}}>Log In</header>
        <label>
          Username
          <input
            type="email"
            placeholder='username'
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className='border w-full'
          />
        </label>
        <label>
          Password
          <input
            type="password"
            placeholder='password'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className='border w-full'
          />
        </label>

        <button type="submit" className='link-btn link-btn-primary'>Log In</button>
      </form>
    </>
  );
}

export default LogIn;
