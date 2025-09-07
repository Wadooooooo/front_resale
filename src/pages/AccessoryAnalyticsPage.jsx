// src/pages/AccessoryAnalyticsPage.jsx

import React, { useState } from 'react';
import { getAccessoryAnalytics } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const AnalyticsTable = ({ title, data, dataKey, unit }) => (
    <div className="order-page-container">
        <h2>{title}</h2>
        <table className="orders-table">
            <thead>
                <tr>
                    <th>Аксессуар</th>
                    <th style={{ textAlign: 'right' }}>{unit}</th>
                </tr>
            </thead>
            <tbody>
                {data.sort((a, b) => parseFloat(b[dataKey]) - parseFloat(a[dataKey])).map(item => (
                    <tr key={item.accessory_name}>
                        <td>{item.accessory_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {parseFloat(item[dataKey]).toLocaleString('ru-RU')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

function AccessoryAnalyticsPage() {
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getAccessoryAnalytics(startDate, endDate);
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по аксессуарам</h1>
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
                <>
                    <AnalyticsTable title="Топ продаж (по количеству)" data={analytics} dataKey="units_sold" unit="Продано (шт.)" />
                    <AnalyticsTable title="Топ продаж (по выручке)" data={analytics} dataKey="total_revenue" unit="Выручка (руб.)" />
                    <AnalyticsTable title="Топ продаж (по прибыли)" data={analytics} dataKey="total_profit" unit="Прибыль (руб.)" />
                </>
            )}
        </div>
    );
}

export default AccessoryAnalyticsPage;