// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser as apiLogin, setAuthToken, getAuthToken, getMe } from '../api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(getAuthToken());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ИСПРАВЛЕННЫЙ useEffect
    useEffect(() => {
        const bootstrapAuth = async () => {
            const currentToken = getAuthToken(); // 1. Получаем токен напрямую из localStorage
            if (currentToken) {
                try {
                    setAuthToken(currentToken); // Устанавливаем токен для будущих запросов axios
                    const userData = await getMe();
                    setUser(userData);
                    setToken(currentToken); // Синхронизируем состояние
                } catch (error) {
                    console.error("Не удалось подтвердить токен, выход из системы.", error);
                    setAuthToken(null); // Очищаем токен в localStorage
                    setToken(null);
                    setUser(null);
                }
            }
            // В любом случае, после проверки, загрузка завершена
            setLoading(false);
        };

        bootstrapAuth();
    }, []); // 2. Пустой массив зависимостей означает, что этот код выполнится ТОЛЬКО ОДИН РАЗ

    const login = async (username, password) => {
        const data = await apiLogin(username, password);
        setAuthToken(data.access_token);
        setToken(data.access_token);
        // После логина нужно загрузить данные пользователя
        const userData = await getMe();
        setUser(userData);
        navigate('/');
    };

    const logout = () => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const hasPermission = (permissionCode) => {
        if (!user || !user.role || !user.role.permissions) {
            return false;
        }
        return user.role.permissions.some(p => p.code === permissionCode);
    };

    const value = { user, token, loading, login, logout, hasPermission };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};