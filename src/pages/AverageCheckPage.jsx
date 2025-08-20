// src/pages/AverageCheckPage.jsx

import React, { useState } from 'react';
import { getAverageCheckAnalytics } from '../api'; 
import './OrdersPage.css'; // Используем общие стили

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const formatCurrency = (num) => parseFloat(num).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 });

function AverageCheckPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            setReport(null);
            const data = await getAverageCheckAnalytics(startDate, endDate);
            setReport(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по среднему чеку</h1>
            <div className="order-page-container">
                <h2>Параметры</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Дата начала:</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                    <div className="form-section"><label>Дата окончания:</label><input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Загрузка...' : 'Сформировать'}</button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {report && (
                <>
                    <div className="order-page-container">
                        <h2>Общий показатель за период</h2>
                        <div className="balance-card" style={{maxWidth: '300px'}}>
                            <h4>Средний чек</h4>
                            <p className="balance-positive">{formatCurrency(report.overall_average_check)}</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                        <div className="order-page-container">
                            <h2>По сотрудникам</h2>
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Сотрудник</th>
                                        <th style={{ textAlign: 'center' }}>Кол-во продаж</th>
                                        <th style={{ textAlign: 'right' }}>Средний чек</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.by_employee.map(item => (
                                        <tr key={item.name}>
                                            <td>{item.name}</td>
                                            <td style={{ textAlign: 'center' }}>{item.sales_count}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.average_check)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="order-page-container">
                            <h2>По источникам трафика</h2>
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Источник</th>
                                        <th style={{ textAlign: 'center' }}>Кол-во продаж</th>
                                        <th style={{ textAlign: 'right' }}>Средний чек</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.by_source.map(item => (
                                        <tr key={item.name}>
                                            <td>{item.name}</td>
                                            <td style={{ textAlign: 'center' }}>{item.sales_count}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.average_check)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AverageCheckPage;
