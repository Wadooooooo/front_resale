// src/pages/CashFlowForecastPage.jsx

import React, { useState } from 'react';
import { getCashFlowForecast } from '../api'; 
import './OrdersPage.css';

const ReportCard = ({ title, value, colorClass = '' }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className={colorClass}>
            {parseFloat(value).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </p>
    </div>
);

function CashFlowForecastPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forecastDays, setForecastDays] = useState(30);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            setReport(null);
            const data = await getCashFlowForecast(forecastDays);
            setReport(data);
        } catch (err) {
            setError('Не удалось построить прогноз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Прогноз движения денежных средств</h1>
            <div className="order-page-container">
                <h2>Параметры</h2>
                <div className="form-section" style={{ maxWidth: '300px' }}>
                    <label>Период прогноза:</label>
                    <select className="form-select" value={forecastDays} onChange={e => setForecastDays(e.target.value)}>
                        <option value="30">Следующие 30 дней</option>
                        <option value="60">Следующие 60 дней</option>
                        <option value="90">Следующие 90 дней</option>
                    </select>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Расчет...' : 'Построить прогноз'}</button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {report && (
                <div className="order-page-container">
                    <h2>Прогноз на {report.forecast_days} дней</h2>
                    <p style={{marginTop: '-1rem', color: '#6c757d'}}>
                        На основе средних показателей за последние {report.historical_days_used} дней.
                    </p>
                    <div className="balances-grid">
                        <ReportCard title="Текущий баланс" value={report.start_balance} />
                        <ReportCard title="Прогноз поступлений" value={report.projected_inflows} colorClass="balance-positive" />
                        <ReportCard title="Прогноз расходов" value={report.projected_outflows} colorClass="balance-negative" />
                        <div className="balance-card" style={{backgroundColor: '#e9ecef'}}>
                             <h4>Прогнозный баланс на конец периода</h4>
                             <p className={report.projected_ending_balance >= 0 ? 'balance-positive' : 'balance-negative'}>
                                {parseFloat(report.projected_ending_balance).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CashFlowForecastPage;