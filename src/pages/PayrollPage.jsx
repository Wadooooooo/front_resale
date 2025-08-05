import React, { useState } from 'react';
import { getPayrollReport } from '../api';
import './OrdersPage.css'; // Используем общие стили

// Функция для получения даты в формате YYYY-MM-DD
const toISODateString = (date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
};

const ReportCard = ({ report }) => {
    return (
        <div className="order-page-container">
            <h3>{report.name || report.username} ({report.role})</h3>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Показатель</th>
                        <th style={{ textAlign: 'center' }}>Кол-во</th>
                        <th style={{ textAlign: 'center' }}>Ставка</th>
                        <th style={{ textAlign: 'right' }}>Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(report.breakdown).map(([key, value]) => {
                        if (!value) return null;
                        let name = key;
                        if (key === 'inspections') name = 'Проверки (чек-лист)';
                        if (key === 'battery_tests') name = 'Тесты АКБ';
                        if (key === 'packaging') name = 'Упаковки';
                        if (key === 'shifts') name = 'Смены';
                        if (key === 'phone_sales_bonus') name = 'Бонус за телефоны';
                        
                        return (
                            <tr key={key}>
                                <td>{name}</td>
                                <td style={{ textAlign: 'center' }}>{value.count}</td>
                                <td style={{ textAlign: 'center' }}>{value.rate} руб.</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(value.total).toLocaleString('ru-RU')} руб.</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <h4 style={{ textAlign: 'right', marginTop: '1rem' }}>
                Итого к выплате: {parseFloat(report.total_salary).toLocaleString('ru-RU')} руб.
            </h4>
        </div>
    );
};

function PayrollPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Даты по умолчанию: с начала текущего месяца по сегодня
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError('');
            setReportData([]);
            const data = await getPayrollReport(startDate, endDate);
            setReportData(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось сформировать отчет.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Отчет по зарплатам</h1>
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
                    {loading ? 'Формирование...' : 'Сформировать отчет'}
                </button>
            </div>

            {error && <p className="form-message error">{error}</p>}
            
            {loading && <h2>Загрузка...</h2>}

            {!loading && reportData.length > 0 && reportData.map(report => (
                <ReportCard key={report.user_id} report={report} />
            ))}
        </div>
    );
}

export default PayrollPage;