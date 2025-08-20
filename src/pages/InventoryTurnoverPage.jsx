// src/pages/InventoryTurnoverPage.jsx

import React, { useState } from 'react';
import { getSellThroughAnalytics } from '../api';
import './OrdersPage.css'; // Используем общие стили

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const ReportCard = ({ title, value, unit = '' }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className="balance-positive" style={{color: '#212529'}}>
            {value.toLocaleString('ru-RU')} {unit}
        </p>
    </div>
);

function InventoryTurnoverPage() {
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
            const data = await getSellThroughAnalytics(startDate, endDate);
            setReport(data);
        } catch (err) {
            setError('Не удалось загрузить отчет.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Отчет по оборачиваемости (Sell-Through)</h1>
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
                <div className="order-page-container">
                    <h2>Результаты за период с {report.start_date} по {report.end_date}</h2>
                    <div className="balances-grid">
                        <ReportCard title="Начальный сток" value={report.initial_stock_count} unit="шт." />
                        <ReportCard title="Поступило за период" value={report.received_count} unit="шт." />
                        <ReportCard title="Продано за период" value={report.sold_count} unit="шт." />
                        <div className="balance-card" style={{backgroundColor: '#e9ecef'}}>
                             <h4>Коэффициент реализации</h4>
                             <p className="balance-positive">{report.sell_through_rate.toFixed(2)} %</p>
                        </div>
                    </div>
                    <div style={{marginTop: '1rem', color: '#6c757d'}}>
                        <p><strong>Коэффициент реализации</strong> — это процент проданных телефонов от общего числа телефонов, которые были доступны для продажи за период. Чем выше этот показатель, тем эффективнее вы продаете свой сток.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventoryTurnoverPage;