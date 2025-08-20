// src/pages/MarginAnalyticsPage.jsx

import React, { useState } from 'react';
import { getMarginAnalytics } from '../api'; 
import './OrdersPage.css'; // Используем общие стили

const formatCurrency = (num) => {
    return parseFloat(num).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
};
const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

function MarginAnalyticsPage() {
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMarginAnalytics(startDate, endDate);
            // Сортируем по убыванию маржинальности
            data.sort((a, b) => parseFloat(b.margin_percent) - parseFloat(a.margin_percent));
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по маржинальности</h1>
            <div className="order-page-container">
                <h2>Параметры</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Дата начала:</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                    <div className="form-section"><label>Дата окончания:</label><input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Загрузка...' : 'Сформировать'}</button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {!loading && analytics.length > 0 && (
                <div className="order-page-container">
                    <h2>Рейтинг моделей по маржинальности</h2>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Модель</th>
                                <th style={{ textAlign: 'right' }}>Средняя цена закупки</th>
                                <th style={{ textAlign: 'right' }}>Средняя цена продажи</th>
                                <th style={{ textAlign: 'right' }}>Маржинальность</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.map(item => (
                                <tr key={item.model_name}>
                                    <td>{item.model_name}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.avg_purchase_price)} руб.</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.avg_sale_price)} руб.</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#198754' }}>
                                        {parseFloat(item.margin_percent).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MarginAnalyticsPage;