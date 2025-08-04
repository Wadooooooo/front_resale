import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './loginPage.module.css';

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Неправильное имя пользователя или пароль.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.login_card}>
        <h1>resale</h1>
      <form onSubmit={handleLogin} className='login-form'>
        <div className={styles.input_group}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.login_input}
            id = 'nameInput'
          />
          <span className={styles.spaninput}>
            Имя пользователя
          </span>
        </div>
        <div className={styles.input_group}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.login_input}
            id = 'passInput'
          />
          <span className={styles.spaninput}>
            Пароль
          </span>
        </div>
        <button type="submit" className={styles.btn}>Войти</button>
      </form>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;