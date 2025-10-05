import React, { useState } from 'react';
// ИЗМЕНЕНИЕ: импортируем getQuarterlyTaxReport вместо getTaxReport
import { getProfitReport, getQuarterlyTaxReport, getExpenseBreakdown } from '../api';
import './OrdersPage.css';

const ReportCard = ({ title, value, colorClass = '' }) => (
    <div className="balance-card">
        <h4>{title}</h4>
        <p className={colorClass}>
            {parseFloat(value).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
        </p>
    </div>
);

const ExpenseDetailsModal = ({ data, onClose }) => {
    if (!data) return null;
    
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '600px' }}>
                <h3>Детализация расходов</h3>
                <p>за период с {data.start_date} по {data.end_date}</p>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Категория</th>
                            <th style={{ textAlign: 'right' }}>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.breakdown.map(item => (
                            <tr key={item.category_name}>
                                <td>{item.category_name}</td>
                                <td style={{ textAlign: 'right' }}>
                                    {parseFloat(item.total_amount).toLocaleString('ru-RU')} руб.
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td>Итого:</td>
                            <td style={{ textAlign: 'right' }}>
                                {parseFloat(data.total_expenses).toLocaleString('ru-RU')} руб.
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <div className="confirm-modal-buttons">
                    <button onClick={onClose} className="btn btn-primary">Закрыть</button>
                </div>
            </div>
        </div>
    );
};


function ReportsPage() {
    // Состояния для отчетов
    const [profitReport, setProfitReport] = useState(null);
    const [taxReport, setTaxReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Состояния для фильтров
    const [profitStartDate, setProfitStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [profitEndDate, setProfitEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Новые состояния для квартального отчета
    const [taxYear, setTaxYear] = useState(new Date().getFullYear());
    const [taxQuarter, setTaxQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseDetails, setExpenseDetails] = useState(null);

    const handleGenerateProfitReport = async () => {
        try {
            setLoading(true);
            setError('');
            setProfitReport(null);
            const data = await getProfitReport(profitStartDate, profitEndDate);
            setProfitReport(data);
        } catch (err) { setError('Не удалось сгенерировать отчет по прибыли.'); } finally { setLoading(false); }
    };

    // Новая функция для генерации налогового отчета
    const handleGenerateTaxReport = async () => {
        try {
            setLoading(true);
            setError('');
            setTaxReport(null);
            const data = await getQuarterlyTaxReport(taxYear, taxQuarter);
            setTaxReport(data);
        } catch (err) { setError('Не удалось сгенерировать налоговый отчет.'); } finally { setLoading(false); }
    };

    const handleOpenExpenseModal = async () => {
        try {
            const data = await getExpenseBreakdown(profitStartDate, profitEndDate);
            setExpenseDetails(data);
            setIsExpenseModalOpen(true);
        } catch (err) {
            setError('Не удалось загрузить детализацию расходов.');
        }
    };

    // Опции для выбора года (текущий год + 4 предыдущих)
    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div>
            <h1>Отчеты</h1>
            {isExpenseModalOpen && <ExpenseDetailsModal data={expenseDetails} onClose={() => setIsExpenseModalOpen(false)} />}
            {error && <p className="form-message error">{error}</p>}

            {/* Блок отчета по прибыли */}
            <div className="order-page-container">
                <h2>Отчет по прибыли</h2>
                <div className="details-grid">
                    <div className="form-section">
                        <label>Дата начала:</label>
                        <input type="date" className="form-input" value={profitStartDate} onChange={e => setProfitStartDate(e.target.value)} />
                    </div>
                    <div className="form-section">
                        <label>Дата окончания:</label>
                        <input type="date" className="form-input" value={profitEndDate} onChange={e => setProfitEndDate(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleGenerateProfitReport} className="btn btn-primary" disabled={loading}>
                    {loading ? 'Генерация...' : 'Сформировать'}
                </button>
                {profitReport && (
                    <div style={{marginTop: '1.5rem'}}>
                        <h4>Результаты за период с {profitReport.start_date} по {profitReport.end_date}</h4>
                        <div className="balances-grid">
                            <ReportCard title="Выручка" value={profitReport.total_revenue} colorClass="balance-positive" />
                            <ReportCard title="Себестоимость" value={profitReport.total_cogs} />
                            <ReportCard title="Валовая прибыль" value={profitReport.gross_profit} colorClass="balance-positive" />
                            <div onClick={handleOpenExpenseModal} style={{cursor: 'pointer'}}>
                                <ReportCard title="Расходы" value={profitReport.total_expenses} colorClass="balance-negative" />
                            </div>
                            <ReportCard title="Операционная прибыль" value={profitReport.operating_profit} colorClass={parseFloat(profitReport.operating_profit) >= 0 ? 'balance-positive' : 'balance-negative'} />
                        </div>
                    </div>
                )}
            </div>

            {/* Новый блок для налогового отчета */}
            <div className="order-page-container">
                <h2>Налоговый отчет (УСН Доходы 6%)</h2>
                <div className="details-grid">
                    <div className="form-section">
                        <label>Год:</label>
                        <select className="form-select" value={taxYear} onChange={e => setTaxYear(e.target.value)}>
                            {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div className="form-section">
                        <label>Квартал:</label>
                        <select className="form-select" value={taxQuarter} onChange={e => setTaxQuarter(e.target.value)}>
                            <option value="1">I квартал (Янв-Мар)</option>
                            <option value="2">II квартал (Апр-Июн)</option>
                            <option value="3">III квартал (Июл-Сен)</option>
                            <option value="4">IV квартал (Окт-Дек)</option>
                        </select>
                    </div>
                </div>
                <button onClick={handleGenerateTaxReport} className="btn btn-primary" disabled={loading}>
                    {loading ? 'Генерация...' : 'Сформировать'}
                </button>
                {taxReport && (
                     <div style={{marginTop: '1.5rem'}}>
                        <h4>Результаты за {taxQuarter} квартал {taxYear} г.</h4>
                        <div className="balances-grid">
                            <ReportCard title="Выручка по терминалу (налоговая база)" value={taxReport.total_card_revenue} />
                            <ReportCard title="Сумма налога к уплате (6%)" value={taxReport.tax_amount} colorClass="balance-negative"/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;