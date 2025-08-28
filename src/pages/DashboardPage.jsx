// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    getDashboardSalesSummary, 
    getDashboardReadyForSale,
    getNotes,          
    createNote,        
    updateNoteStatus,
    getActiveShift, 
    startShift, 
    endShift,
    getUnreadNotifications,
    markNotificationAsRead
} from '../api';
import './OrdersPage.css'; // Используем общие стили
import './DashboardPage.css';
import { useAuth } from '../context/AuthContext';

// Карточка для отображения статистики
const StatCard = ({ title, value, isCurrency = true }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className="balance-positive">
            {isCurrency ? `${parseFloat(value).toLocaleString('ru-RU')} руб.` : value}
        </p>
    </div>
);

function DashboardPage() {
    const [summary, setSummary] = useState(null);
    const [readyForSale, setReadyForSale] = useState([]);
    const [serialNumber, setSerialNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [showAllNotes, setShowAllNotes] = useState(false);
    const { user, hasPermission } = useAuth();
    const [activeShift, setActiveShift] = useState(null);

    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const [isConfirmEndShiftModalOpen, setIsConfirmEndShiftModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [summaryData, readyForSaleData, notesData, shiftData, notificationsData] = await Promise.all([
                    getDashboardSalesSummary(),
                    getDashboardReadyForSale(),
                    getNotes(showAllNotes),
                    getActiveShift(),
                    getUnreadNotifications()
                ]);
                setSummary(summaryData);
                setReadyForSale(readyForSaleData);
                setNotes(notesData);
                setActiveShift(shiftData);
                setNotifications(notificationsData); 
            } catch (error) {
                console.error("Ошибка загрузки данных для дэшборда:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [showAllNotes]);

    const handleMarkNotificationRead = async (id) => {
        try {
            // Отправляем запрос на сервер, чтобы отметить уведомление как прочитанное
            await markNotificationAsRead(id);
            
            // Теперь просто удаляем это уведомление из нашего локального списка на странице,
            // чтобы оно сразу исчезло из интерфейса.
            setNotifications(prevNotifications => 
                prevNotifications.filter(notification => notification.id !== id)
            );
        } catch (error) {
            alert('Не удалось отметить уведомление как прочитанное.');
        }
    };
    const handleStartShift = async () => {
        try {
            const shift = await startShift();
            setActiveShift(shift);
            setNotification({ isOpen: true, message: 'Смена успешно начата!' });
        } catch (err) {
            setNotification({ isOpen: true, message: err.response?.data?.detail || 'Не удалось начать смену.' });
        }
    };

    const handleEndShift = () => {
        setIsConfirmEndShiftModalOpen(true);
    };

    // Эта новая функция будет вызвана при нажатии "Да" в окне подтверждения
    const confirmAndEndShift = async () => {
        setIsConfirmEndShiftModalOpen(false); // Сначала закрываем окно
        try {
            await endShift();
            setActiveShift(null);
            setNotification({ isOpen: true, message: 'Смена успешно завершена!' });
        } catch (err) {
            setNotification({ isOpen: true, message: err.response?.data?.detail || 'Не удалось завершить смену.' });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (serialNumber.trim()) {
            navigate(`/phone-history/${serialNumber.trim()}`);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) return;
        try {
            const newNote = await createNote(newNoteContent);
            setNotes([newNote, ...notes]);
            setNewNoteContent('');
        } catch (error) {
            alert('Не удалось добавить заметку.');
        }
    };

    const handleToggleNote = async (noteId, currentStatus) => {
        try {
            const updatedNote = await updateNoteStatus(noteId, !currentStatus);
            setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
        } catch (error) {
            alert('Не удалось обновить статус заметки.');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Рабочий стол</h1>
                {activeShift ? (
                    <button onClick={handleEndShift} className="btn btn-danger" style={{ marginTop: 0 }}>Завершить смену</button>
                ) : (
                    <button onClick={handleStartShift} className="btn btn-primary" style={{ marginTop: 0 }}>Начать смену</button>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="order-page-container notifications-container">
                    <h2>Уведомления ({notifications.length})</h2>
                    {notifications.map(notif => (
                        <div key={notif.id} className="notification-item">
                            <span className="notification-message">{notif.message}</span>
                            <button 
                                onClick={() => handleMarkNotificationRead(notif.id)} 
                                className="btn btn-secondary btn-compact"
                            >
                                Прочитано
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="dashboard-grid">
                {/* Левая колонка */}
                <div className="dashboard-column">
                    <div className="order-page-container">
                        <h2>Сводка за смену</h2>
                        {summary && (
                            <div className="balances-grid">
                                <Link to="/my-sales?period=today" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <StatCard title="Продаж за смену" value={summary.sales_count} isCurrency={false} />
                                </Link>
                                <StatCard title="Наличными в кассе" value={summary.cash_in_register} />
                                <StatCard title="Общая выручка" value={summary.total_revenue} />
                            </div>
                        )}
                    </div>

                    <div className="order-page-container">
                        <h2>Быстрые действия</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <form onSubmit={handleSearch} className="search-form-container" style={{ flexGrow: 1 }}>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="Поиск по S/N для возврата или ремонта..."
                                    className="form-input"
                                />
                                <button type="submit" className="btn btn-primary ">Найти</button>
                            </form>
                            <Link to="/sales" className="btn btn-success" style={{ marginTop: 0, height: '50px', width: '70px' }}>
                                🛒 Продажа
                            </Link>
                            <Link to="/stock" className="btn btn-secondary" style={{ marginTop: 0, height: '50px', width: '70px' }}>
                                🗂️ Открыть каталог
                            </Link>
                        </div>
                    </div>

                    <div className="order-page-container">
                        <h2>Недавно на складе</h2>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Модель</th>
                                    <th>S/N</th>
                                </tr>
                            </thead>
                            <tbody>
                                {readyForSale.map(phone => (
                                    <tr key={phone.id} onClick={() => navigate(`/phone-history/${phone.serial_number}`)} style={{cursor: 'pointer'}}>
                                        <td>{phone.id}</td>
                                        <td>{phone.model?.name || 'Нет данных'}</td>
                                        <td>{phone.serial_number}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Правая колонка для заметок */}
                <div className="dashboard-column">
                    <div className="order-page-container">
                        <div className="notes-header">
                            <h2>Заметки для смены</h2>
                            <label>
                                <input type="checkbox" checked={showAllNotes} onChange={() => setShowAllNotes(!showAllNotes)} />
                                Показать выполненные
                            </label>
                        </div>
                        <form onSubmit={handleAddNote} className="add-note-form">
                            <textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder="Оставить заметку для следующей смены..."
                                className="form-input"
                                rows="3"
                            />
                            <button type="submit" className="btn btn-primary">Добавить</button>
                        </form>
                        <div className="notes-list">
                            {notes.map(note => {
                                const canToggle = !note.is_completed ||
                                                (note.completed_by && user && user.id === note.completed_by.id) ||
                                                hasPermission('manage_inventory');
                                return (
                                    <div key={note.id} className={`note-item ${note.is_completed ? 'completed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={note.is_completed}
                                            onChange={() => handleToggleNote(note.id, note.is_completed)}
                                            disabled={!canToggle}
                                        />
                                        <div className="note-content">
                                            <p>{note.content}</p>
                                            <small>
                                                {note.created_by.name || note.created_by.username} - {new Date(note.created_at).toLocaleString('ru-RU')}
                                                {note.is_completed && note.completed_by && (
                                                    <span> | Выполнил: {note.completed_by.name || note.completed_by.username}</span>
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* VVV ДОБАВЬТЕ ВЕСЬ ЭТОТ БЛОК VVV */}
            {/* Окно для уведомлений */}
            {notification.isOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Уведомление</h3>
                        <p>{notification.message}</p>
                        <div className="confirm-modal-buttons">
                            <button 
                                onClick={() => setNotification({ isOpen: false, message: '' })} 
                                className="btn btn-primary"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Окно для подтверждения завершения смены */}
            {isConfirmEndShiftModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Подтверждение</h3>
                        <p>Вы уверены, что хотите завершить смену?</p>
                        <div className="confirm-modal-buttons">
                            <button onClick={confirmAndEndShift} className="btn btn-danger">Да, завершить</button>
                            <button onClick={() => setIsConfirmEndShiftModalOpen(false)} className="btn btn-secondary">Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default DashboardPage;