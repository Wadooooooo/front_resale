// src/pages/ProductAnalyticsPage.jsx

import React, { useState } from 'react';
import { getProductAnalytics, getProductAnalyticsDetails } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

// --- НОВЫЙ КОМПОНЕНТ: Модальное окно для детализации ---
const DetailsModal = ({ modelName, startDate, endDate, onClose }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const loadDetails = async () => {
            try {
                setLoading(true);
                const data = await getProductAnalyticsDetails(modelName, startDate, endDate);
                setSales(data);
            } catch (err) {
                console.error("Ошибка загрузки деталей продаж", err);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [modelName, startDate, endDate]);

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ maxWidth: '800px' }}>
                <h3>Продажи модели "{modelName}"</h3>
                {loading ? <p>Загрузка...</p> : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID Чека</th>
                                <th>Дата</th>
                                <th style={{ textAlign: 'right' }}>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{new Date(sale.sale_date + 'Z').toLocaleString('ru-RU')}</td>
                                    <td style={{ textAlign: 'right' }}>{parseFloat(sale.total_amount).toLocaleString('ru-RU')} руб.</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="confirm-modal-buttons">
                    <button onClick={onClose} className="btn btn-primary">Закрыть</button>
                </div>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ ТАБЛИЦЫ ТЕПЕРЬ ПРИНИМАЕТ onRowClick ---
const AnalyticsTable = ({ title, data, dataKey, unit, onRowClick }) => (
    <div className="order-page-container">
        <h2>{title}</h2>
        <table className="orders-table">
            <thead>
                <tr>
                    <th>Модель</th>
                    <th style={{ textAlign: 'right' }}>{unit}</th>
                </tr>
            </thead>
            <tbody>
                {data.sort((a, b) => parseFloat(b[dataKey]) - parseFloat(a[dataKey])).map(item => (
                    <tr key={item.model_name} onClick={() => onRowClick(item.model_name)} style={{ cursor: 'pointer' }}>
                        <td>{item.model_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {parseFloat(item[dataKey]).toLocaleString('ru-RU')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

function ProductAnalyticsPage() {
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));
    
    // --- НОВОЕ СОСТОЯНИЕ ДЛЯ МОДАЛЬНОГО ОКНА ---
    const [selectedModel, setSelectedModel] = useState(null);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getProductAnalytics(startDate, endDate);
            setAnalytics(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* --- Вызов модального окна --- */}
            {selectedModel && (
                <DetailsModal 
                    modelName={selectedModel} 
                    startDate={startDate} 
                    endDate={endDate} 
                    onClose={() => setSelectedModel(null)} 
                />
            )}

            <h1>Аналитика по товарам</h1>
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
                    <AnalyticsTable title="Топ продаж (по количеству)" data={analytics} dataKey="units_sold" unit="Продано (шт.)" onRowClick={setSelectedModel} />
                    <AnalyticsTable title="Топ продаж (по выручке)" data={analytics} dataKey="total_revenue" unit="Выручка (руб.)" onRowClick={setSelectedModel} />
                    <AnalyticsTable title="Топ продаж (по прибыли)" data={analytics} dataKey="total_profit" unit="Прибыль (руб.)" onRowClick={setSelectedModel} />
                </>
            )}
        </div>
    );
}

export default ProductAnalyticsPage;