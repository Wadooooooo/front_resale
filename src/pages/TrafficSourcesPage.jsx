// file: src/pages/TrafficSourcesPage.jsx

import React, { useState, useEffect } from 'react';
import { getTrafficSources, createTrafficSource, updateTrafficSource, deleteTrafficSource } from '../api';
import './OrdersPage.css'; // Используем общие стили

function TrafficSourcesPage() {
    const [sources, setSources] = useState([]);
    const [newName, setNewName] = useState('');
    const [editingSource, setEditingSource] = useState(null); // { id, name }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getTrafficSources();
            setSources(data);
        } catch (err) {
            setError('Не удалось загрузить источники.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            await createTrafficSource({ name: newName });
            setMessage(`Источник "${newName}" успешно добавлен.`);
            setNewName('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при добавлении.');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            await updateTrafficSource(editingSource.id, { name: editingSource.name });
            setMessage(`Источник "${editingSource.name}" успешно обновлен.`);
            setEditingSource(null);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при обновлении.');
        }
    };

    const handleDelete = async (sourceId) => {
        if (window.confirm('Вы уверены? Это может повлиять на старые записи о клиентах.')) {
            setError(''); setMessage('');
            try {
                await deleteTrafficSource(sourceId);
                setMessage('Источник удален.');
                fetchData();
            } catch (err) {
                setError('Ошибка при удалении.');
            }
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Источники трафика</h1>
            {error && <p className="form-message error">{error}</p>}
            {message && <p className="form-message success">{message}</p>}

            <div className="order-page-container">
                <h2>Добавить новый источник</h2>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Название (например, Авито)"
                        className="form-input"
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ marginTop: 0 }}>Добавить</button>
                </form>
            </div>

            <div className="order-page-container">
                <h2>Существующие источники</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th style={{ width: '200px' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map(source => (
                            <tr key={source.id}>
                                <td>{source.id}</td>
                                <td>
                                    {editingSource?.id === source.id ? (
                                        <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                type="text" 
                                                value={editingSource.name}
                                                onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                                                className="form-input form-input-compact"
                                                autoFocus
                                            />
                                            <button type="submit" className="btn btn-primary btn-compact" style={{width: 'auto'}}>Сохранить</button>
                                        </form>
                                    ) : (
                                        source.name
                                    )}
                                </td>
                                <td>
                                    {editingSource?.id === source.id ? (
                                        <button onClick={() => setEditingSource(null)} className="btn btn-secondary btn-compact">Отмена</button>
                                    ) : (
                                        <>
                                            <button onClick={() => setEditingSource({ id: source.id, name: source.name })} className="btn btn-secondary btn-compact">Редактировать</button>
                                            <button onClick={() => handleDelete(source.id)} className="btn btn-danger btn-compact">Удалить</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TrafficSourcesPage;