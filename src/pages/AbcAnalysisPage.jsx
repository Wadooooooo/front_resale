// src/pages/AbcAnalysisPage.jsx

import React, { useState } from 'react';
import { getAbcAnalysis } from '../api'; 
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const AnalysisTable = ({ title, description, items, totalRevenue }) => (
    <div className="order-page-container">
        <h2>{title} <span style={{fontSize: '1rem', color: '#6c757d'}}>({items.length} моделей)</span></h2>
        <p style={{marginTop: '-1rem', color: '#6c757d'}}>{description}</p>
        <table className="orders-table">
            <thead>
                <tr>
                    <th>Модель</th>
                    <th style={{ textAlign: 'right' }}>Выручка</th>
                    <th style={{ textAlign: 'right' }}>Доля в общей выручке</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.model_name}>
                        <td>{item.model_name}</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(item.total_revenue).toLocaleString('ru-RU')} руб.</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(item.revenue_percentage).toFixed(2)}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

function AbcAnalysisPage() {
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
            const data = await getAbcAnalysis(startDate, endDate);
            setReport(data);
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>ABC-анализ товаров по выручке</h1>
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
                    <AnalysisTable 
                        title="Группа A (Важнейшие товары)"
                        description="Эти товары приносят основную часть выручки (до 80%). На них нужно сосредоточить максимум внимания."
                        items={report.group_a}
                        totalRevenue={report.total_revenue}
                    />
                    <AnalysisTable 
                        title="Группа B (Стабильные товары)"
                        description="Эти товары приносят среднюю часть выручки (следующие 15%). Это стабильный актив."
                        items={report.group_b}
                        totalRevenue={report.total_revenue}
                    />
                    <AnalysisTable 
                        title="Группа C (Наименее важные товары)"
                        description="Эти товары приносят меньшую часть выручки (последние 5%). Возможно, стоит пересмотреть ассортимент."
                        items={report.group_c}
                        totalRevenue={report.total_revenue}
                    />
                </>
            )}
        </div>
    );
}

export default AbcAnalysisPage;