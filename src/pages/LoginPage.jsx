import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0 0 0 / 10%)' }}>
      <h2>Вход в систему</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Имя пользователя: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: 'calc(100% - 22px)', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label>Пароль: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: 'calc(100% - 22px)', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Войти</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;