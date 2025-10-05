import React from 'react';
import { useAuth } from '../context/AuthContext';

const switcherStyle = {
    cursor: 'pointer',
    fontSize: '1.5rem', // Размер иконки
    background: 'none',
    border: 'none',
    padding: '0.5rem',
};

function ThemeSwitcher() {
  const { theme, toggleTheme } = useAuth();

  return (
    <button onClick={toggleTheme} style={switcherStyle} title="Сменить тему">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeSwitcher;