// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser as apiLogin, setAuthTokens, getAuthToken, getRefreshToken, getMe, logoutUser } from '../api'; 
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const bootstrapAuth = useCallback(async () => {
        const accessToken = getAuthToken();
        const refreshToken = getRefreshToken();

        if (!accessToken && !refreshToken) {
            setLoading(false);
            return;
        }
        
        try {
            const userData = await getMe();
            setUser(userData);
        } catch (error) {
            console.error("Bootstrap auth failed:", error);
            // Если токен устарел, logoutUser очистит хранилище
            await logoutUser();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        bootstrapAuth();
    }, [bootstrapAuth]);

    const login = useCallback(async (username, password) => {
        const data = await apiLogin(username, password);
        setAuthTokens(data); // Сохраняем оба токена
        const userData = await getMe();
        setUser(userData);
        navigate('/');
    }, [navigate]);

    const logout = useCallback(async () => {
        await logoutUser(); // Вызываем API для выхода
        setUser(null);
        navigate('/login');
    }, [navigate]);
    
    const hasPermission = useCallback((permissionCode) => {
        if (!user || !user.role || !user.role.permissions) {
            return false;
        }
        return user.role.permissions.some(p => p.code === permissionCode);
    }, [user]);

    const value = { user, token: getAuthToken(), loading, login, logout, hasPermission };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} // <--- УБРАНА ;

export function useAuth() {
    return useContext(AuthContext);
} // <--- УБРАНА ;