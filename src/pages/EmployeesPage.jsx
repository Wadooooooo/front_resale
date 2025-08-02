// src/pages/EmployeesPage.jsx

import React, { useState, useEffect } from 'react';
import { getRoles, registerEmployee, getUsers, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';
import './OrdersPage.css';

function EmployeesPage() {
    const [roles, setRoles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        last_name: '',
        email: '',
        role_id: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { user } = useAuth();

    const loadData = async () => {
        try {
            // Сбрасываем сообщения при каждой загрузке
            setError('');
            setMessage('');
            setLoading(true);

            const [rolesData, usersData] = await Promise.all([
                getRoles(),
                getUsers()
            ]);
            setRoles(rolesData);
            setEmployees(usersData);
        } catch (err) {
            setError('Не удалось загрузить данные.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (selectedOption) => {
        setFormData(prev => ({ ...prev, role_id: selectedOption ? selectedOption.value : null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('Регистрация сотрудника...');

        if (!formData.role_id) {
            setError('Пожалуйста, выберите роль для сотрудника.');
            setMessage('');
            return;
        }

        try {
            await registerEmployee(formData);
            setMessage(`Сотрудник "${formData.username}" успешно зарегистрирован!`);
            setFormData({
                username: '', password: '', name: '',
                last_name: '', email: '', role_id: null,
            });
            await loadData(); // Обновляем список сотрудников
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при регистрации.');
            setMessage('');
        }
    };

    const handleDelete = async (userId, username) => {
        if (user && userId === user.id) {
            alert("Вы не можете удалить свою собственную учетную запись.");
            return;
        }
        if (window.confirm(`Вы уверены, что хотите удалить сотрудника "${username}"?`)) {
            try {
                await deleteUser(userId);
                setMessage(`Сотрудник "${username}" успешно удален.`);
                await loadData(); // Обновляем список
            } catch (err) {
                setError(err.response?.data?.detail || "Ошибка при удалении сотрудника.");
            }
        }
    };

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.role_name
    }));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Управление сотрудниками</h1>
            {error && <p className="form-message error">{error}</p>}
            {message && <p className="form-message success">{message}</p>}

            <div className="order-page-container">
                <h2>Регистрация нового сотрудника</h2>
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Имя пользователя (логин)*</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-section">
                            <label>Пароль*</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-section">
                            <label>Имя</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-section">
                            <label>Фамилия</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-section">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-section">
                            <label>Роль*</label>
                            <Select
                                options={roleOptions}
                                value={roleOptions.find(opt => opt.value === formData.role_id)}
                                onChange={handleRoleChange}
                                placeholder="Выберите роль..."
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Зарегистрировать</button>
                </form>
            </div>

            <div className="order-page-container">
                <h2>Список сотрудников</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Логин</th>
                            <th>Имя</th>
                            <th>Роль</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(employee => (
                            <tr key={employee.id}>
                                <td>{employee.id}</td>
                                <td>{employee.username}</td>
                                <td>{`${employee.name || ''} ${employee.last_name || ''}`.trim()}</td>
                                <td>{employee.role ? employee.role.role_name : 'Не назначена'}</td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(employee.id, employee.username)}
                                        className="btn btn-danger btn-compact"
                                        disabled={user && user.id === employee.id}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}




export default EmployeesPage;