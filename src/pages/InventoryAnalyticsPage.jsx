// src/pages/InventoryAnalyticsPage.jsx

import React, { useState } from 'react';
import { getInventoryAnalytics } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

function InventoryAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setFullYear(new Date().getFullYear() - 1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getInventoryAnalytics(startDate, endDate);
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Аналитика по складу</h1>
            <div className="order-page-container">
                <h2>Параметры</h2>
                <p><small>Анализ брака считается за выбранный период. Залежавшиеся товары показываются на текущий момент.</small></p>
                <div className="details-grid">
                    <div className="form-section"><label>Дата начала (для брака):</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                    <div className="form-section"><label>Дата окончания (для брака):</label><input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Загрузка...' : 'Сформировать'}</button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {!loading && analytics && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                    <div className="order-page-container">
                        <h2>Топ-20 залежавшихся товаров</h2>
                        <table className="orders-table">
                           <thead><tr><th>Модель</th><th>S/N</th><th style={{textAlign:'right'}}>Дней на складе</th></tr></thead>
                           <tbody>
                               {analytics.slow_moving_stock.map(item => (
                                   <tr key={item.phone_id}>
                                       <td>{item.model_name}</td>
                                       <td>{item.serial_number}</td>
                                       <td style={{textAlign:'right', fontWeight: 'bold'}}>{item.days_in_stock}</td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                    <div>
                        <div className="order-page-container">
                            <h2>Рейтинг брака по моделям</h2>
                            <table className="orders-table">
                                <thead><tr><th>Модель</th><th style={{textAlign:'right'}}>% брака</th></tr></thead>
                                <tbody>
                                    {analytics.defect_by_model.map(item => (
                                        <tr key={item.model_name}>
                                            <td>{item.model_name}</td>
                                            <td style={{textAlign:'right', color: item.defect_rate > 10 ? 'red' : 'inherit'}}>{item.defect_rate.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="order-page-container">
                            <h2>Рейтинг брака по поставщикам</h2>
                            <table className="orders-table">
                               <thead><tr><th>Поставщик</th><th style={{textAlign:'right'}}>% брака</th></tr></thead>
                               <tbody>
                                   {analytics.defect_by_supplier.map(item => (
                                       <tr key={item.supplier_name}>
                                           <td>{item.supplier_name}</td>
                                           <td style={{textAlign:'right', color: item.defect_rate > 10 ? 'red' : 'inherit'}}>{item.defect_rate.toFixed(2)}%</td>
                                       </tr>
                                   ))}
                               </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventoryAnalyticsPage;