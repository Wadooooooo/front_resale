// src/pages/EmployeeAnalyticsPage.jsx

import React, { useState } from 'react';
import { getEmployeeAnalytics } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

function EmployeeAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getEmployeeAnalytics(startDate, endDate);
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по сотрудникам</h1>
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
                <>
                    <div className="order-page-container">
                        <h2>Рейтинг продавцов</h2>
                        <table className="orders-table">
                            <thead><tr><th>Сотрудник</th><th style={{textAlign:'right'}}>Выручка</th><th style={{textAlign:'center'}}>Телефонов продано</th><th style={{textAlign:'center'}}>Кол-во чеков</th><th style={{textAlign:'right'}}>Средний чек</th></tr></thead>
                            <tbody>
                                {analytics.sales_performance.map(item => (
                                    <tr key={item.user_id}>
                                        <td>{item.user_name}</td>
                                        <td style={{textAlign:'right', fontWeight: 'bold'}}>{parseFloat(item.total_revenue).toLocaleString('ru-RU')} руб.</td>
                                        <td style={{textAlign:'center'}}>{item.phones_sold}</td>
                                        <td style={{textAlign:'center'}}>{item.sales_count}</td>
                                        <td style={{textAlign:'right'}}>{parseFloat(item.avg_check_size).toLocaleString('ru-RU')} руб.</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="order-page-container">
                        <h2>Эффективность техников</h2>
                        <table className="orders-table">
                            <thead><tr><th>Сотрудник</th><th style={{textAlign:'center'}}>Инспекций</th><th style={{textAlign:'center'}}>Тестов АКБ</th><th style={{textAlign:'center'}}>Упаковок</th></tr></thead>
                            <tbody>
                                {analytics.technical_performance.map(item => (
                                    <tr key={item.user_id}>
                                        <td>{item.user_name}</td>
                                        <td style={{textAlign:'center'}}>{item.inspections_count}</td>
                                        <td style={{textAlign:'center'}}>{item.battery_tests_count}</td>
                                        <td style={{textAlign:'center'}}>{item.packaging_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default EmployeeAnalyticsPage;