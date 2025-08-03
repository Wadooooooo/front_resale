// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardSalesSummary, getDashboardReadyForSale } from '../api';
import './OrdersPage.css'; // Используем общие стили

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

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [summaryData, readyForSaleData] = await Promise.all([
                    getDashboardSalesSummary(),
                    getDashboardReadyForSale()
                ]);
                setSummary(summaryData);
                setReadyForSale(readyForSaleData);
            } catch (error) {
                console.error("Ошибка загрузки данных для дэшборда:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (serialNumber.trim()) {
            navigate(`/phone-history/${serialNumber.trim()}`);
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Рабочий стол продавца</h1>
            
            <div className="order-page-container">
                <h2>Сводка за смену</h2>
                {summary && (
                    <div className="balances-grid">
                        <StatCard title="Продаж за смену" value={summary.sales_count} isCurrency={false} />
                        <StatCard title="Наличными в кассе" value={summary.cash_in_register} />
                        <StatCard title="Общая выручка" value={summary.total_revenue} />
                    </div>
                )}
            </div>
            <div className="order-page-container">
                <h2>Быстрые действия</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* VVV 2. ЗАМЕНИТЕ ВАШУ ФОРМУ НА ЭТОТ БЛОК VVV */}
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
    );
}

export default DashboardPage;