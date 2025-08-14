// src/pages/DepositsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { createDeposit, getDepositsDetails, getAccounts, createDepositPayment } from '../api';
import './OrdersPage.css';

// Вспомогательные функции (без изменений)
const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 });
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('ru-RU');

// --- НОВЫЙ КОМПОНЕНТ: Модальное окно для оплаты ---
const PaymentModal = ({ deposit, accounts, onClose, onConfirm }) => {
    const [amount, setAmount] = useState(deposit.remaining_debt > 0 ? parseFloat(deposit.remaining_debt).toFixed(2) : '');
    const [accountId, setAccountId] = useState(null);

    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    const handleSubmit = () => {
        if (!accountId || !amount || parseFloat(amount) <= 0) {
            alert('Выберите счет и укажите положительную сумму.');
            return;
        }
        onConfirm({
            deposit_id: deposit.id,
            amount: parseFloat(amount),
            account_id: accountId.value
        });
    };

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>Оплата по вкладу: {deposit.lender_name}</h3>
                <p>Остаток долга: <strong>{formatCurrency(deposit.remaining_debt)}</strong></p>
                <div className="form-section">
                    <label>Счет списания*</label>
                    <Select options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Выберите счет..."/>
                </div>
                <div className="form-section">
                    <label>Сумма выплаты*</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="form-input" />
                </div>
                <div className="confirm-modal-buttons">
                    <button onClick={handleSubmit} className="btn btn-primary">Подтвердить выплату</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </div>
        </div>
    );
};


function DepositsPage() {
    // ... (старые состояния без изменений)
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [targetDate, setTargetDate] = useState(toISODateString(new Date()));
    const [formData, setFormData] = useState({ lender_name: '', principal_amount: '', annual_interest_rate: '', start_date: toISODateString(new Date()) });
    
    // --- НОВЫЕ СОСТОЯНИЯ ---
    const [accounts, setAccounts] = useState([]);
    const [depositToPay, setDepositToPay] = useState(null); // Для модального окна

    const loadData = async () => {
        try {
            setLoading(true);
            // Загружаем сразу и вклады, и счета
            const [data, accountsData] = await Promise.all([
                getDepositsDetails(targetDate),
                getAccounts()
            ]);
            setDeposits(data);
            setAccounts(accountsData);
        } catch (err) {
            setError('Не удалось загрузить данные о вкладах.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [targetDate]);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        try {
            await createDeposit(formData);
            setMessage('Новый вклад успешно добавлен!');
            setFormData({ lender_name: '', principal_amount: '', annual_interest_rate: '', start_date: toISODateString(new Date()) });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при добавлении вклада.');
        }
    };

    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ПЛАТЕЖА ---
    const handlePaymentConfirm = async (paymentData) => {
        setMessage(''); setError('');
        try {
            await createDepositPayment(paymentData);
            setMessage(`Платеж на сумму ${paymentData.amount} руб. успешно проведен.`);
            setDepositToPay(null); // Закрываем модальное окно
            await loadData(); // Обновляем данные
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при проведении платежа.');
        }
    };
    
    const totalDebt = useMemo(() => deposits.reduce((sum, d) => sum + parseFloat(d.remaining_debt), 0), [deposits]);

    return (
        <div>
            {/* --- ВЫЗОВ МОДАЛЬНОГО ОКНА --- */}
            {depositToPay && <PaymentModal deposit={depositToPay} accounts={accounts} onClose={() => setDepositToPay(null)} onConfirm={handlePaymentConfirm} />}
            
            <h1>Вклады (Обязательства)</h1>
            {error && <p className="form-message error">{error}</p>}
            {message && <p className="form-message success">{message}</p>}

            <div className="order-page-container">
                <h2>Добавить новый вклад</h2>
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section"><label>Имя вкладчика*</label><input type="text" name="lender_name" value={formData.lender_name} onChange={handleInputChange} className="form-input" required /></div>
                        <div className="form-section"><label>Сумма вклада (руб.)*</label><input type="number" step="0.01" name="principal_amount" value={formData.principal_amount} onChange={handleInputChange} className="form-input" required /></div>
                        <div className="form-section"><label>Годовой процент (%)*</label><input type="number" step="0.01" name="annual_interest_rate" value={formData.annual_interest_rate} onChange={handleInputChange} className="form-input" required /></div>
                        <div className="form-section"><label>Дата получения*</label><input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="form-input" required /></div>
                    </div>
                    <button type="submit" className="btn btn-primary">Добавить вклад</button>
                </form>
            </div>

            <div className="order-page-container">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Расчет долга</h2>
                    <div className="form-section" style={{marginBottom: 0, maxWidth: '250px'}}>
                        <label>Рассчитать на дату:</label>
                        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="form-input"/>
                    </div>
                </div>
                
                {loading ? <p>Загрузка расчетов...</p> : (
                    <table className="orders-table" style={{marginTop: '1.5rem'}}>
                        <thead>
                            <tr>
                                <th>Вкладчик</th>
                                <th style={{textAlign: 'right'}}>Тело долга</th>
                                <th style={{textAlign: 'center'}}>Ставка</th>
                                <th>Дата начала</th>
                                <th style={{textAlign: 'right'}}>Процент в месяц</th>
                                <th style={{textAlign: 'center'}}>Месяцев прошло</th>
                                <th style={{textAlign: 'right'}}>Начислено %</th>
                                <th style={{textAlign: 'right'}}>Выплачено</th>
                                <th style={{textAlign: 'right', fontWeight: 'bold'}}>Остаток долга</th>
                                <th style={{textAlign: 'right', fontWeight: 'bold'}}>Общий долг</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map(d => (
                                <tr key={d.id}>
                                    <td>{d.lender_name}</td>
                                    <td style={{textAlign: 'right'}}>{formatCurrency(d.principal_amount)}</td>
                                    <td style={{textAlign: 'center'}}>{parseFloat(d.annual_interest_rate)}%</td>
                                    <td>{formatDate(d.start_date)}</td>
                                    <td style={{textAlign: 'right'}}>{formatCurrency(d.monthly_interest)}</td>
                                    <td style={{textAlign: 'center'}}>{d.months_passed}</td>
                                    <td style={{textAlign: 'right', color: '#dc3545'}}>{formatCurrency(d.total_interest)}</td>
                                    <td style={{textAlign: 'right', color: '#198754'}}>{formatCurrency(d.total_paid)}</td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(d.remaining_debt)}</td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(d.total_debt)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="9" style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem'}}>ИТОГО ОСТАТОК ДОЛГА:</td>
                                <td style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem'}}>{formatCurrency(totalDebt)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default DepositsPage;