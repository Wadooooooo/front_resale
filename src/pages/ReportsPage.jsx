import React, { useState } from 'react';
import { getProfitReport } from '../api';
import './OrdersPage.css'; // Используем те же стили

// Вспомогательный компонент для отображения метрик
const ReportCard = ({ title, value, colorClass = '' }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className={colorClass}>
            {parseFloat(value).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </p>
    </div>
);

function ReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Устанавливаем даты по умолчанию: с начала текущего месяца по сегодня
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError('');
            setReport(null);
            const data = await getProfitReport(startDate, endDate);
            setReport(data);
        } catch (err) {
            setError('Не удалось сгенерировать отчет.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Отчет по прибыли</h1>
            <div className="order-page-container">
                <h2>Параметры отчета</h2>
                <div className="details-grid">
                    <div className="form-section">
                        <label>Дата начала:</label>
                        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-section">
                        <label>Дата окончания:</label>
                        <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleGenerateReport} className="btn btn-primary" disabled={loading}>
                    {loading ? 'Генерация...' : 'Сформировать отчет'}
                </button>
            </div>

            {error && <p className="form-message error">{error}</p>}

            {report && (
                <div className="order-page-container">
                    <h2>Результаты за период с {report.start_date} по {report.end_date}</h2>
                    <div className="balances-grid">
                        <ReportCard title="Выручка" value={report.total_revenue} colorClass="balance-positive" />
                        <ReportCard title="Себестоимость" value={report.total_cogs} />
                        <ReportCard title="Валовая прибыль" value={report.gross_profit} colorClass="balance-positive" />
                        <ReportCard title="Расходы" value={report.total_expenses} colorClass="balance-negative" />
                        <ReportCard title="Операционная прибыль" value={report.operating_profit} colorClass={parseFloat(report.operating_profit) >= 0 ? 'balance-positive' : 'balance-negative'} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportsPage;