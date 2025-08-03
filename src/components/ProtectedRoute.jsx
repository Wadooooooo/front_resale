// file: src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, permission }) => {
    const { user, hasPermission } = useAuth();

    // Если данных о пользователе еще нет, можно показать заглушку
    if (!user) {
        return <div>Проверка прав доступа...</div>;
    }
    
    // Если у пользователя нет нужного права, перенаправляем его на рабочий стол
    if (!hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Если право есть, показываем страницу
    return children;
};

export default ProtectedRoute;