// src/pages/CustomerAnalyticsPage.jsx

import React, { useState } from 'react';
import { getCustomerAnalytics } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

function CustomerAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getCustomerAnalytics(startDate, endDate);
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по клиентам</h1>
            <div className="order-page-container">
                <h2>Параметры</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Дата начала:</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                    <div className="form-section"><label>Дата окончания:</label><input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Загрузка...' : 'Сформировать'}</button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {!loading && analytics && (
                <div className="order-page-container">
                    <h2>Эффективность источников трафика</h2>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Источник</th>
                                <th style={{textAlign:'center'}}>Кол-во клиентов</th>
                                <th style={{textAlign:'right'}}>Общая выручка</th>
                                <th style={{textAlign:'right'}}>Средний чек на клиента</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.sources_performance.map(item => {
                                const avgRevenue = item.client_count > 0 ? parseFloat(item.total_revenue) / item.client_count : 0;
                                return (
                                    <tr key={item.source_id || 'none'}>
                                        <td>{item.source_name}</td>
                                        <td style={{textAlign:'center'}}>{item.client_count}</td>
                                        <td style={{textAlign:'right', fontWeight: 'bold'}}>{parseFloat(item.total_revenue).toLocaleString('ru-RU')} руб.</td>
                                        <td style={{textAlign:'right'}}>{avgRevenue.toLocaleString('ru-RU')} руб.</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default CustomerAnalyticsPage;