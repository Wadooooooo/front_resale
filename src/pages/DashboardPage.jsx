// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    getDashboardSalesSummary, 
    getDashboardReadyForSale,
    getNotes,          
    createNote,        
    updateNoteStatus   
} from '../api';
import './OrdersPage.css'; // Используем общие стили
import './DashboardPage.css';


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

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [summaryData, readyForSaleData] = await Promise.all([
                    getDashboardSalesSummary(),
                    getDashboardReadyForSale(),
                    getNotes(showAllNotes)
                ]);
                setSummary(summaryData);
                setReadyForSale(readyForSaleData);
                setNotes(notesData);
            } catch (error) {
                console.error("Ошибка загрузки данных для дэшборда:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [showAllNotes]);

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
            setNotes([newNote, ...notes]); // Добавляем новую заметку в начало списка
            setNewNoteContent('');
        } catch (error) {
            alert('Не удалось добавить заметку.');
        }
    };

    const handleToggleNote = async (noteId, currentStatus) => {
        try {
            const updatedNote = await updateNoteStatus(noteId, !currentStatus);
            // Обновляем заметку в списке
            setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
        } catch (error) {
            alert('Не удалось обновить статус заметки.');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Рабочий стол продавца</h1>
            
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
                                <button type="submit" className="btn btn-primary">Найти</button>
                            </form>
                            <Link to="/stock" className="btn btn-secondary" style={{ marginTop: 0 }}>
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
                            {notes.map(note => (
                                <div key={note.id} className={`note-item ${note.is_completed ? 'completed' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={note.is_completed} 
                                        onChange={() => handleToggleNote(note.id, note.is_completed)}
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
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;