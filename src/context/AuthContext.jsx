// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser as apiLogin, setAuthToken, getAuthToken, getMe } from '../api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(getAuthToken());
    const [loading, setLoading] = useState(true); // <--- Изначально загрузка
    const navigate = useNavigate();

    useEffect(() => {
        const bootstrapAuth = async () => {
            const currentToken = getAuthToken();
            if (currentToken) {
                try {
                    // Устанавливаем токен для axios ДО первого запроса
                    setAuthToken(currentToken); 
                    const userData = await getMe();
                    setUser(userData);
                    setToken(currentToken);
                } catch (error) {
                    console.error("Не удалось подтвердить токен, выход из системы.", error);
                    setAuthToken(null);
                    setToken(null);
                    setUser(null);
                }
            }
            // В любом случае (даже если токена не было) убираем загрузку
            setLoading(false);
        };

        bootstrapAuth();
    }, []); // Пустой массив зависимостей гарантирует, что это выполнится один раз

    const login = useCallback(async (username, password) => {
        const data = await apiLogin(username, password);
        setAuthToken(data.access_token);
        setToken(data.access_token);
        const userData = await getMe();
        setUser(userData);
        navigate('/');
    }, [navigate]);

    const logout = useCallback(() => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const hasPermission = useCallback((permissionCode) => {
        if (!user || !user.role || !user.role.permissions) {
            return false;
        }
        return user.role.permissions.some(p => p.code === permissionCode);
    }, [user]);

    const value = { user, token, loading, login, logout, hasPermission };

    return (
        <AuthContext.Provider value={value}>
            {/* Показываем приложение только после завершения начальной загрузки */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
};