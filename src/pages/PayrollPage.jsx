import React, { useState } from 'react';
import Select from 'react-select';
import { getPayrollReport, paySalary, getAccounts } from '../api';
import './OrdersPage.css';

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

const PaymentModal = ({ user, accounts, onClose, onPaid }) => {
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState(null);
    const [notes, setNotes] = useState('');

    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !accountId || parseFloat(amount) <= 0) {
            alert('Пожалуйста, введите положительную сумму и выберите счет.');
            return;
        }
        try {
            const paymentData = {
                amount: parseFloat(amount),
                account_id: accountId.value,
                notes
            };
            await paySalary(user.user_id, paymentData);
            onPaid(); // Эта функция обновит отчет
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при проведении выплаты.');
        }
    };

    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>Выплата ЗП: {user.name || user.username}</h3>
                <p>К выплате: <strong>{parseFloat(user.balance).toLocaleString('ru-RU')} руб.</strong></p>
                <div className="form-section">
                    <label>Сумма выплаты*</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="form-input" required />
                </div>
                <div className="form-section">
                    <label>Счет списания*</label>
                    <Select options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Выберите счет..." />
                </div>
                <div className="form-section">
                    <label>Примечание</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows="2" />
                </div>
                <div className="confirm-modal-buttons">
                    <button type="submit" className="btn btn-primary">Провести выплату</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </form>
        </div>
    );
};

function PayrollPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));
    const [accounts, setAccounts] = useState([]);
    const [userToPay, setUserToPay] = useState(null);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError('');
            setReportData([]);
            const [data, accountsData] = await Promise.all([
                getPayrollReport(startDate, endDate),
                getAccounts()
            ]);
            setReportData(data);
            setAccounts(accountsData);
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось сформировать отчет.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setUserToPay(null);
        handleGenerateReport(); // Обновляем отчет после успешной выплаты
    };

    return (
        <div>
            {userToPay && <PaymentModal user={userToPay} accounts={accounts} onClose={() => setUserToPay(null)} onPaid={handlePaymentSuccess} />}
            
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

            {!loading && reportData.map(report => (
                <div className="order-page-container" key={report.user_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>{report.name || report.username} ({report.role})</h3>
                        <button onClick={() => setUserToPay(report)} className="btn btn-success" style={{ marginTop: 0 }} disabled={report.balance <= 0}>
                            Выплатить
                        </button>
                    </div>
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
                    <div style={{ textAlign: 'right', marginTop: '1rem', lineHeight: '1.6' }}>
                        <div>Начислено за период: <strong>{parseFloat(report.total_earned).toLocaleString('ru-RU')} руб.</strong></div>
                        <div>Выплачено за период: <strong style={{color: '#dc3545'}}>{parseFloat(report.total_paid).toLocaleString('ru-RU')} руб.</strong></div>
                        <hr style={{margin: '0.5rem 0'}} />
                        <div style={{fontSize: '1.1rem'}}>К выплате: <strong>{parseFloat(report.balance).toLocaleString('ru-RU')} руб.</strong></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default PayrollPage;