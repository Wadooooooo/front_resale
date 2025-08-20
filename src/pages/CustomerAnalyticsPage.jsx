// src/pages/CustomerAnalyticsPage.jsx

import React, { useState } from 'react';
// ИЗМЕНЕНИЕ: Импортируем обе функции
import { getCustomerAnalytics, getRepeatCustomerAnalytics } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const ReportCard = ({ title, value, unit = '' }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className="balance-positive" style={{color: '#212529'}}>
            {value.toLocaleString('ru-RU')} {unit}
        </p>
    </div>
);

function CustomerAnalyticsPage() {
    // ИЗМЕНЕНИЕ: Добавляем состояние для нового отчета
    const [sourceAnalytics, setSourceAnalytics] = useState(null);
    const [repeatAnalytics, setRepeatAnalytics] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            setSourceAnalytics(null);
            setRepeatAnalytics(null);

            // ИЗМЕНЕНИЕ: Запрашиваем оба отчета сразу
            const [sourceData, repeatData] = await Promise.all([
                getCustomerAnalytics(startDate, endDate),
                getRepeatCustomerAnalytics(startDate, endDate)
            ]);
            
            setSourceAnalytics(sourceData);
            setRepeatAnalytics(repeatData);

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

            {/* ИЗМЕНЕНИЕ: Новый блок для отчета по повторным покупкам */}
            {repeatAnalytics && (
                <div className="order-page-container">
                    <h2>Повторные покупки</h2>
                    <p style={{marginTop: '-1rem', color: '#6c757d'}}>Анализ клиентов, совершивших покупку в выбранном периоде.</p>
                     <div className="balances-grid">
                        <ReportCard title="Всего клиентов за период" value={repeatAnalytics.total_customers} />
                        <ReportCard title="Из них вернулись снова" value={repeatAnalytics.repeat_customers} />
                        <div className="balance-card" style={{backgroundColor: '#e9ecef'}}>
                             <h4>Коэффициент удержания</h4>
                             <p className="balance-positive">{repeatAnalytics.repeat_rate.toFixed(2)} %</p>
                        </div>
                    </div>
                </div>
            )}

            {sourceAnalytics && (
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
                            {sourceAnalytics.sources_performance.map(item => {
                                const avgRevenue = item.client_count > 0 ? parseFloat(item.total_revenue) / item.client_count : 0;
                                return (
                                    <tr key={item.source_id || 'none'}>
                                        <td>{item.source_name}</td>
                                        <td style={{textAlign:'center'}}>{item.client_count}</td>
                                        <td style={{textAlign:'right', fontWeight: 'bold'}}>{parseFloat(item.total_revenue).toLocaleString('ru-RU')} руб.</td>
                                        <td style={{textAlign:'right'}}>{avgRevenue.toLocaleString('ru-RU', {maximumFractionDigits: 0})} руб.</td>
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