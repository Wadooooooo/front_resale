// src/pages/CashFlowPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import Select, { components } from 'react-select';
import { 
    getCashFlows, createCashFlow, getOperationCategories, 
    getCounterparties, getAccounts, createAccount, createCounterparty,
    getAccountsWithBalances
} from '../api';
import './OrdersPage.css';

// Компоненты Modal и ControlWithButton (без изменений)
const ControlWithButton = ({ children, ...props }) => {
    const { onButtonClick } = props.selectProps;
    return (
        <components.Control {...props}>
            {children}
            <button type="button" onClick={onButtonClick} className="add-button-in-select">+</button>
        </components.Control>
    );
};
const Modal = ({ title, onClose, onSubmit, children }) => {
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>{title}</h3>
                <form onSubmit={onSubmit}>
                    {children}
                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function CashFlowPage() {
    // Состояния данных
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [counterparties, setCounterparties] = useState([]);
    const [accounts, setAccounts] = useState([]);
    
    // Состояния UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false); // <--- ИЗМЕНЕНИЕ 1: Добавлено состояние видимости
    
    // Состояния пагинации и фильтрации
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const PAGE_SIZE = 25;

    // Состояния форм и модальных окон
    const [newTransaction, setNewTransaction] = useState({ operation_categories_id: '', account_id: '', counterparty_id: '', amount: '', description: '' });
    const [transferForm, setTransferForm] = useState({ from_account_id: null, to_account_id: null, amount: '', description: '' });
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCounterpartyModalOpen, setIsCounterpartyModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const skip = (page - 1) * PAGE_SIZE;
            const transDataPromise = getCashFlows(skip, PAGE_SIZE, selectedAccountId);

            // Загружаем остальные данные только при первой загрузке или сбросе фильтра
            if (page === 1 && selectedAccountId === null) {
                const [transData, catData, countData, accWithBalancesData] = await Promise.all([
                    transDataPromise, getOperationCategories(), getCounterparties(), getAccountsWithBalances()
                ]);
                setCategories(catData);
                setCounterparties(countData);
                setAccounts(accWithBalancesData);
                setTransactions(transData.items);
                setTotalPages(Math.ceil(transData.total / PAGE_SIZE));
            } else {
                const transData = await transDataPromise;
                setTransactions(transData.items);
                setTotalPages(Math.ceil(transData.total / PAGE_SIZE));
                setAccounts(await getAccountsWithBalances());
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Произошла ошибка при загрузке.');
        } finally {
            setLoading(false);
        }
    }, [page, selectedAccountId]);

    useEffect(() => {
        // Загружаем данные только если история видима или это первая загрузка
        if (isHistoryVisible || loading) {
            loadData();
        }
    }, [loadData, isHistoryVisible]);
    
    // <--- ИЗМЕНЕНИЕ 2: Обновлена логика клика по карточке --- >
    const handleAccountCardClick = (accountId) => {
        const isClosing = selectedAccountId === accountId;
        setSelectedAccountId(isClosing ? null : accountId);
        setIsHistoryVisible(!isClosing); // Показываем при выборе, скрываем при повторном клике
        setPage(1); // Всегда сбрасываем на первую страницу при клике
    };

    // ... (остальные обработчики без изменений)
    const handleInputChange = (e) => { const { name, value } = e.target; setNewTransaction(prev => ({ ...prev, [name]: value })); };
    const handleSelectChange = (selectedOption, action) => { const { name } = action; const value = selectedOption ? selectedOption.value : ''; if (name === 'operation_categories_id') { const selectedCategory = categories.find(c => c.id === value); const currentAmount = parseFloat(newTransaction.amount) || 0; let newAmount = currentAmount; if (selectedCategory && selectedCategory.type === 'expense') { newAmount = -Math.abs(currentAmount); } else { newAmount = Math.abs(currentAmount); } setNewTransaction(prev => ({ ...prev, [name]: value, amount: newAmount || '' })); } else { setNewTransaction(prev => ({ ...prev, [name]: value })); } };
    const handleAmountChange = (e) => { const { value } = e.target; const selectedCategory = categories.find(c => c.id === parseInt(newTransaction.operation_categories_id)); if (selectedCategory && selectedCategory.type === 'expense') { setNewTransaction(prev => ({ ...prev, amount: -Math.abs(parseFloat(value) || 0) })); } else { setNewTransaction(prev => ({ ...prev, amount: parseFloat(value) || '' })); } };
    const handleAddAccount = async (e) => { e.preventDefault(); try { await createAccount({ name: newItemName }); setNewItemName(''); setIsAccountModalOpen(false); await loadData(); } catch (err) { setError('Ошибка при добавлении счета.'); } };
    const handleAddCounterparty = async (e) => { e.preventDefault(); try { await createCounterparty({ name: newItemName }); setNewItemName(''); setIsCounterpartyModalOpen(false); await loadData(); } catch (err) { setError('Ошибка при добавлении контрагента.'); } };
    const handleSubmit = async (e) => { e.preventDefault(); setError(''); setMessage('Сохранение...'); if (!newTransaction.operation_categories_id || !newTransaction.account_id || !newTransaction.amount) { setError('Пожалуйста, заполните все обязательные поля (*).'); setMessage(''); return; } const dataToSend = { ...newTransaction, amount: parseFloat(newTransaction.amount), operation_categories_id: parseInt(newTransaction.operation_categories_id), account_id: parseInt(newTransaction.account_id), counterparty_id: newTransaction.counterparty_id ? parseInt(newTransaction.counterparty_id) : null, }; try { await createCashFlow(dataToSend); setMessage('Операция успешно добавлена!'); setNewTransaction({ operation_categories_id: '', account_id: '', counterparty_id: '', amount: '', description: '', }); if (page === 1) { await loadData(); } else { setPage(1); } } catch (err) { setError(err.response?.data?.detail || 'Произошла неизвестная ошибка при сохранении.'); setMessage(''); } };
    const handleTransferSubmit = async (e) => { e.preventDefault(); setError(''); setMessage('Выполняется перевод...'); const { from_account_id, to_account_id, amount } = transferForm; if (!from_account_id || !to_account_id || !amount || parseFloat(amount) <= 0) { setError('Пожалуйста, выберите оба счета и введите положительную сумму.'); setMessage(''); return; } if (from_account_id.value === to_account_id.value) { setError('Счета списания и зачисления не должны совпадать.'); setMessage(''); return; } const withdrawalCategory = categories.find(c => c.name === 'Выбытие - Перевод между счетами'); const depositCategory = categories.find(c => c.name === 'Поступление - Перевод между счетами'); if (!withdrawalCategory || !depositCategory) { setError('Необходимые категории для перевода не найдены в базе.'); setMessage(''); return; } const numericAmount = Math.abs(parseFloat(amount)); const fromAccountName = allAccountOptions.find(a => a.value === from_account_id.value)?.label || ''; const toAccountName = allAccountOptions.find(a => a.value === to_account_id.value)?.label || ''; const withdrawalData = { operation_categories_id: withdrawalCategory.id, account_id: from_account_id.value, amount: -numericAmount, description: `Перевод на счет "${toAccountName}". ${transferForm.description}`.trim() }; const depositData = { operation_categories_id: depositCategory.id, account_id: to_account_id.value, amount: numericAmount, description: `Перевод со счета "${fromAccountName}". ${transferForm.description}`.trim() }; try { await Promise.all([createCashFlow(withdrawalData), createCashFlow(depositData)]); setMessage('Перевод успешно выполнен!'); setTransferForm({ from_account_id: null, to_account_id: null, amount: '', description: '' }); setSelectedAccountId(null); if (page === 1) { await loadData(); } else { setPage(1); } } catch (err) { setError('Ошибка при выполнении перевода.'); setMessage(''); } };

    const categoryOptions = categories.filter(c => c.type !== 'transfer').map(cat => ({ value: cat.id, label: cat.name }));
    const allAccountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));
    const counterpartyOptions = counterparties.map(c => ({ value: c.id, label: c.name }));
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    return (
        <div>
            <h1>Движение Денег</h1>
            {isAccountModalOpen && ( <Modal title="Добавить новый счет" onClose={() => setIsAccountModalOpen(false)} onSubmit={handleAddAccount}> <div className="form-section"> <label>Название счета</label> <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="form-input" required autoFocus /> </div> </Modal> )}
            {isCounterpartyModalOpen && ( <Modal title="Добавить нового контрагента" onClose={() => setIsCounterpartyModalOpen(false)} onSubmit={handleAddCounterparty}> <div className="form-section"> <label>Имя контрагента</label> <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="form-input" required autoFocus /> </div> </Modal> )}
            
            <div className="order-page-container">
                <h2>Балансы по счетам</h2>
                <div className="balances-grid">
                    <div className={`balance-card ${selectedAccountId === null ? 'active' : ''}`} onClick={() => handleAccountCardClick(null)} style={{ cursor: 'pointer' }}>
                        <h4>Общий баланс</h4>
                        <p className={totalBalance >= 0 ? 'balance-positive' : 'balance-negative'}>{totalBalance.toLocaleString('ru-RU')}</p>
                    </div>
                    {accounts.map(account => (
                        <div key={account.id} className={`balance-card ${selectedAccountId === account.id ? 'active' : ''}`} onClick={() => handleAccountCardClick(account.id)} style={{ cursor: 'pointer' }}>
                            <h4>{account.name}</h4>
                            <p className={account.balance >= 0 ? 'balance-positive' : 'balance-negative'}>{parseFloat(account.balance).toLocaleString('ru-RU')}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* <--- ИЗМЕНЕНИЕ 3: Обернули весь блок в условие --- > */}
            {isHistoryVisible && (
                <div className="order-page-container">
                    <h2>История операций {selectedAccountId !== null && ` (Счет: ${accounts.find(a => a.id === selectedAccountId)?.name})`}</h2>
                    {loading ? <p>Загрузка операций...</p> : (
                        <>
                            <table className="orders-table">
                                <thead><tr><th>ID</th><th>Дата</th><th>Категория</th><th>Счет</th><th>Контрагент</th><th style={{textAlign: 'right'}}>Сумма</th><th>Описание</th></tr></thead>
                                <tbody>
                                    {transactions.map(t => (<tr key={t.id}><td>{t.id}</td><td>{new Date(t.date).toLocaleString('ru-RU')}</td><td>{t.operation_category?.name || '-'}</td><td>{t.account?.name || '-'}</td><td>{t.counterparty?.name || '-'}</td><td style={{ color: t.amount > 0 ? 'green' : 'red', fontWeight: '500', textAlign: 'right' }}>{t.amount > 0 ? '+' : ''}{parseFloat(t.amount).toLocaleString('ru-RU')}</td><td>{t.description}</td></tr>))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setPage(1)} disabled={page <= 1} className="btn btn-secondary">
                                    В начало
                                </button>
                                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn btn-secondary">
                                    Назад
                                </button>
                                <span>Страница {page} из {totalPages}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn btn-secondary">
                                    Вперед
                                </button>
                                <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="btn btn-secondary">
                                    В конец
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            <div className="order-page-container">
                <h2>Перевод между счетами</h2>
                <form onSubmit={handleTransferSubmit}>
                     <div className="details-grid">
                        <div className="form-section"><label>Со счета:</label><Select options={allAccountOptions} value={transferForm.from_account_id} onChange={(val) => setTransferForm(prev => ({...prev, from_account_id: val}))} placeholder="Счет списания..." isClearable /></div>
                        <div className="form-section"><label>На счет:</label><Select options={allAccountOptions.filter(opt => opt.value !== transferForm.from_account_id?.value)} value={transferForm.to_account_id} onChange={(val) => setTransferForm(prev => ({...prev, to_account_id: val}))} placeholder="Счет зачисления..." isClearable /></div>
                        <div className="form-section"><label>Сумма:</label><input type="number" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm(prev => ({...prev, amount: e.target.value}))} className="form-input" placeholder="0.00" /></div>
                     </div>
                     <div className="form-section"><label>Комментарий (необязательно):</label><textarea value={transferForm.description} onChange={(e) => setTransferForm(prev => ({...prev, description: e.target.value}))} className="form-input" rows="2" /></div>
                     <button type="submit" className="btn btn-primary">Выполнить перевод</button>
                </form>
            </div>

            <div className="order-page-container">
                 <h2>Добавить операцию</h2>
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section"> <label>Категория*</label> <Select name="operation_categories_id" options={categoryOptions} value={categoryOptions.find(opt => opt.value === newTransaction.operation_categories_id)} onChange={(val, act) => handleSelectChange(val, act)} placeholder="Выберите..." isClearable required /> </div>
                        <div className="form-section"> <label>Счет*</label> <Select name="account_id" options={allAccountOptions} value={allAccountOptions.find(opt => opt.value === newTransaction.account_id)} onChange={(val, act) => handleSelectChange(val, act)} placeholder="Выберите..." isClearable required components={{ Control: ControlWithButton }} onButtonClick={() => setIsAccountModalOpen(true)} /> </div>
                        <div className="form-section"> <label>Контрагент</label> <Select name="counterparty_id" options={counterpartyOptions} value={counterpartyOptions.find(opt => opt.value === newTransaction.counterparty_id)} onChange={(val, act) => handleSelectChange(val, act)} placeholder="(Не выбрано)" isClearable components={{ Control: ControlWithButton }} onButtonClick={() => setIsCounterpartyModalOpen(true)} /> </div>
                        <div className="form-section"> <label>Сумма*</label> <input type="number" step="0.01" name="amount" value={newTransaction.amount} onChange={handleAmountChange} className="form-input" required /> </div>
                    </div>
                    <div className="form-section"> <label>Описание</label> <textarea name="description" value={newTransaction.description} onChange={handleInputChange} className="form-input" rows="3"></textarea> </div>
                    <button type="submit" className="btn btn-primary">Добавить</button>
                    {error && <p className="form-message error">{error}</p>}
                    {message && <p className="form-message success">{message}</p>}
                </form>
            </div>
        </div>
    );
}

export default CashFlowPage;