import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { 
    getCashFlows, createCashFlow, getOperationCategories, 
    getCounterparties, getAccounts, createAccount, createCounterparty,
    getTotalBalance,
    getInventoryValuation 
} from '../api';
import './OrdersPage.css';

// Кастомный компонент для Select, который добавляет кнопку "+"
const ControlWithButton = ({ children, ...props }) => {
    // onButtonClick будет передаваться в <Select> как пропс
    const { onButtonClick } = props.selectProps;
    return (
        <components.Control {...props}>
            {children}
            <button type="button" onClick={onButtonClick} className="add-button-in-select">+</button>
        </components.Control>
    );
};

// Компонент модального окна для добавления записей
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
    // --- Состояния ---
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [counterparties, setCounterparties] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [inventoryValue, setInventoryValue] = useState(0);

    // Состояния для основной формы "Добавить операцию"
    const [newTransaction, setNewTransaction] = useState({
        operation_categories_id: '', account_id: '', counterparty_id: '',
        amount: '', description: '',
    });

    // --- НОВОЕ: Состояния для формы "Перевод" ---
    const [transferForm, setTransferForm] = useState({
        from_account_id: null,
        to_account_id: null,
        amount: '',
        description: '',
    });

    // Состояния для модальных окон
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCounterpartyModalOpen, setIsCounterpartyModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [totalBalance, setTotalBalance] = useState(0);

    // --- Функции загрузки и обработки ---
    const loadData = async () => {
        try {
            setLoading(true);
            // VVV ИСПРАВЛЕНИЕ ЗДЕСЬ: Добавь inventoryData в список VVV
            const [transData, catData, countData, accData, totalBalanceData, inventoryData] = await Promise.all([
                getCashFlows(), 
                getOperationCategories(), 
                getCounterparties(), 
                getAccounts(),
                getTotalBalance(),
                getInventoryValuation()
            ]);
            setTransactions(transData);
            setCategories(catData);
            setCounterparties(countData);
            setAccounts(accData);
            setTotalBalance(totalBalanceData.total_balance);
            setInventoryValue(inventoryData.total_valuation); // Теперь эта строка будет работать
            
        } catch (err) {
            console.error("!!! ПОЛНАЯ ОШИБКА ЗАГРУЗКИ:", err);
            const detail = err.response?.data?.detail;
            setError(detail || 'Произошла неизвестная ошибка при загрузке.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    
    // --- НОВОЕ: Обработчик для формы перевода ---
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('Выполняется перевод...');

        const { from_account_id, to_account_id, amount } = transferForm;

        if (!from_account_id || !to_account_id || !amount || parseFloat(amount) <= 0) {
            setError('Пожалуйста, выберите оба счета и введите положительную сумму.');
            setMessage('');
            return;
        }
        if (from_account_id.value === to_account_id.value) {
            setError('Счета списания и зачисления не должны совпадать.');
            setMessage('');
            return;
        }

        const withdrawalCategory = categories.find(c => c.name === 'Выбытие - Перевод между счетами');
        const depositCategory = categories.find(c => c.name === 'Поступление - Перевод между счетами');

        // Проверяем, что обе категории найдены
        if (!withdrawalCategory || !depositCategory) {
            setError('Необходимые категории для перевода (ID 1 и 3) не найдены в базе. Проверьте их названия.');
            setMessage('');
            return;
        }

        const numericAmount = Math.abs(parseFloat(amount));
        const fromAccountName = accounts.find(a => a.id === from_account_id.value)?.name || '';
        const toAccountName = accounts.find(a => a.id === to_account_id.value)?.name || '';

        const withdrawalData = {
            // --- ИЗМЕНЕНИЕ ---
            operation_categories_id: withdrawalCategory.id, // Используем ID категории "Выбытие"
            account_id: from_account_id.value,
            amount: -numericAmount, // Расход
            description: `Перевод на счет "${toAccountName}". ${transferForm.description}`.trim()
        };

        const depositData = {
            // --- ИЗМЕНЕНИЕ ---
            operation_categories_id: depositCategory.id, // Используем ID категории "Поступление"
            account_id: to_account_id.value,
            amount: numericAmount, // Приход
            description: `Перевод со счета "${fromAccountName}". ${transferForm.description}`.trim()
        };
        
        try {
            await Promise.all([createCashFlow(withdrawalData), createCashFlow(depositData)]);
            setMessage('Перевод успешно выполнен!');
            setTransferForm({ from_account_id: null, to_account_id: null, amount: '', description: '' });
            await loadData();
        } catch (err) {
            setError('Ошибка при выполнении перевода.');
            setMessage('');
        }
    };
    
    // --- Существующие обработчики для основной формы (без изменений) ---
    // (здесь находятся handleInputChange, handleSelectChange, handleAmountChange, handleSubmit и т.д.)
    const handleInputChange = (e) => { const { name, value } = e.target; setNewTransaction(prev => ({ ...prev, [name]: value })); };
    const handleSelectChange = (selectedOption, action) => {
        const { name } = action; const value = selectedOption ? selectedOption.value : '';
        if (name === 'operation_categories_id') {
            const selectedCategory = categories.find(c => c.id === value);
            const currentAmount = parseFloat(newTransaction.amount) || 0; let newAmount = currentAmount;
            if (selectedCategory && selectedCategory.type === 'expense') { newAmount = -Math.abs(currentAmount); } else { newAmount = Math.abs(currentAmount); }
            setNewTransaction(prev => ({ ...prev, [name]: value, amount: newAmount || '' }));
        } else { setNewTransaction(prev => ({ ...prev, [name]: value })); }
    };
    const handleAmountChange = (e) => {
        const { value } = e.target;
        const selectedCategory = categories.find(c => c.id === parseInt(newTransaction.operation_categories_id));
        if (selectedCategory && selectedCategory.type === 'expense') { setNewTransaction(prev => ({ ...prev, amount: -Math.abs(parseFloat(value) || 0) }));
        } else { setNewTransaction(prev => ({ ...prev, amount: parseFloat(value) || '' })); }
    };
    const handleAddAccount = async (e) => { e.preventDefault(); try { await createAccount({ name: newItemName }); setNewItemName(''); setIsAccountModalOpen(false); await loadData(); } catch (err) { setError('Ошибка при добавлении счета.'); } };
    const handleAddCounterparty = async (e) => { e.preventDefault(); try { await createCounterparty({ name: newItemName }); setNewItemName(''); setIsCounterpartyModalOpen(false); await loadData(); } catch (err) { setError('Ошибка при добавлении контрагента.'); } };
    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setMessage('Сохранение...');
        if (!newTransaction.operation_categories_id || !newTransaction.account_id || !newTransaction.amount) { setError('Пожалуйста, заполните все обязательные поля (*).'); setMessage(''); return; }
        const dataToSend = { ...newTransaction, amount: parseFloat(newTransaction.amount), operation_categories_id: parseInt(newTransaction.operation_categories_id), account_id: parseInt(newTransaction.account_id), counterparty_id: newTransaction.counterparty_id ? parseInt(newTransaction.counterparty_id) : null, };
        try {
            await createCashFlow(dataToSend); setMessage('Операция успешно добавлена!');
            setNewTransaction({ operation_categories_id: '', account_id: '', counterparty_id: '', amount: '', description: '', });
            await loadData();
        } catch (err) { if (err.response && err.response.data && err.response.data.detail) { if (Array.isArray(err.response.data.detail)) { const errorMessages = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join('; '); setError(`Ошибка валидации: ${errorMessages}`); } else { setError(err.response.data.detail); } } else { setError('Произошла неизвестная ошибка при сохранении.'); } setMessage(''); }
    };


    // --- Подготовка данных для Select ---
    const categoryOptions = categories.filter(c => c.type !== 'transfer').map(cat => ({ value: cat.id, label: cat.name }));
    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));
    const counterpartyOptions = counterparties.map(c => ({ value: c.id, label: c.name }));
    const selectedCategory = categoryOptions.find(opt => opt.value === newTransaction.operation_categories_id);
    const selectedAccount = accountOptions.find(opt => opt.value === newTransaction.account_id);
    const selectedCounterparty = counterpartyOptions.find(opt => opt.value === newTransaction.counterparty_id);
    const accountBalances = accounts.map(account => {
        const balance = transactions.filter(t => t.account_id === account.id).reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return { ...account, balance };
    });

    if (loading) return <h2>Загрузка...</h2>;

    // --- JSX-разметка ---
    return (
        <div>
            <h1>Движение Денег</h1>
            {/* ... (Модальные окна остаются без изменений) ... */}
            {isAccountModalOpen && ( <Modal title="Добавить новый счет" onClose={() => setIsAccountModalOpen(false)} onSubmit={handleAddAccount}> <div className="form-section"> <label>Название счета</label> <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="form-input" required autoFocus /> </div> </Modal> )}
            {isCounterpartyModalOpen && ( <Modal title="Добавить нового контрагента" onClose={() => setIsCounterpartyModalOpen(false)} onSubmit={handleAddCounterparty}> <div className="form-section"> <label>Имя контрагента</label> <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="form-input" required autoFocus /> </div> </Modal> )}

            <div className="order-page-container">
                <h2>Балансы по счетам</h2>
                <div className="balances-grid">
                    <div className="balance-card" style={{ backgroundColor: '#e9ecef' }}>
                        <h4>Общий баланс</h4>
                        <p className={totalBalance >= 0 ? 'balance-positive' : 'balance-negative'}>
                            {parseFloat(totalBalance).toLocaleString('ru-RU')}
                        </p>
                    </div>
                    {accountBalances.map(account => (
                        <div key={account.id} className="balance-card">
                            <h4>{account.name}</h4>
                            <p className={account.balance >= 0 ? 'balance-positive' : 'balance-negative'}>
                                {account.balance.toLocaleString('ru-RU')}
                            </p>
                        </div>
                    ))}
                    <div className="balance-card" style={{ backgroundColor: '#eef2f6' }}>
                        <h4>Стоимость склада (телефоны)</h4>
                        <p className="balance-positive">
                            {parseFloat(inventoryValue).toLocaleString('ru-RU')}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- НОВЫЙ БЛОК: ФОРМА ПЕРЕВОДА --- */}
            <div className="order-page-container">
                <h2>Перевод между счетами</h2>
                <form onSubmit={handleTransferSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Со счета:</label>
                            <Select options={accountOptions} value={transferForm.from_account_id}
                                onChange={(val) => setTransferForm(prev => ({...prev, from_account_id: val}))}
                                placeholder="Счет списания..." isClearable
                            />
                        </div>
                        <div className="form-section">
                            <label>На счет:</label>
                             <Select options={accountOptions} value={transferForm.to_account_id}
                                onChange={(val) => setTransferForm(prev => ({...prev, to_account_id: val}))}
                                placeholder="Счет зачисления..." isClearable
                            />
                        </div>
                        <div className="form-section">
                            <label>Сумма:</label>
                            <input type="number" step="0.01" value={transferForm.amount}
                                onChange={(e) => setTransferForm(prev => ({...prev, amount: e.target.value}))}
                                className="form-input" placeholder="0.00" required
                            />
                        </div>
                    </div>
                     <div className="form-section">
                        <label>Комментарий (необязательно):</label>
                        <input type="text" value={transferForm.description}
                            onChange={(e) => setTransferForm(prev => ({...prev, description: e.target.value}))}
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Выполнить перевод</button>
                </form>
            </div>

            {/* ... (Существующая форма "Добавить операцию" и таблица "История операций" остаются без изменений) ... */}
            <div className="order-page-container">
                <h2>Добавить операцию</h2>
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Категория*</label>
                            <Select name="operation_categories_id" options={categoryOptions} value={selectedCategory} onChange={handleSelectChange} placeholder="Выберите или введите категорию..." isClearable required />
                        </div>
                        <div className="form-section">
                            <label>Счет*</label>
                            <Select name="account_id" options={accountOptions} value={selectedAccount} onChange={handleSelectChange} placeholder="Выберите счет..." isClearable required components={{ Control: ControlWithButton }} onButtonClick={() => setIsAccountModalOpen(true)} />
                        </div>
                        <div className="form-section">
                            <label>Контрагент</label>
                            <Select name="counterparty_id" options={counterpartyOptions} value={selectedCounterparty} onChange={handleSelectChange} placeholder="(Не выбрано)" isClearable components={{ Control: ControlWithButton }} onButtonClick={() => setIsCounterpartyModalOpen(true)} />
                        </div>
                        <div className="form-section">
                            <label>Сумма*</label>
                            <input type="number" step="0.01" name="amount" value={newTransaction.amount} onChange={handleAmountChange} className="form-input" required />
                        </div>
                    </div>
                    <div className="form-section">
                        <label>Описание</label>
                        <textarea name="description" value={newTransaction.description} onChange={handleInputChange} className="form-input" rows="3"></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Добавить</button>
                    {error && <p className="form-message error">{error}</p>}
                    {message && <p className="form-message success">{message}</p>}
                </form>
            </div>

            <div className="order-page-container">
                <h2>История операций</h2>
                <table className="orders-table">
                    <thead>
                        <tr><th>ID</th><th>Дата</th><th>Категория</th><th>Счет</th><th>Контрагент</th><th className="text-right">Сумма</th><th>Описание</th></tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => {
                            const amount = parseFloat(t.amount);
                            const categoryName = categories.find(c => c.id === t.operation_categories_id)?.name || '-';
                            const accountName = accounts.find(a => a.id === t.account_id)?.name || '-';
                            const counterpartyName = counterparties.find(c => c.id === t.counterparty_id)?.name || '-';
                            return (
                                <tr key={t.id}>
                                    <td>{t.id}</td><td>{new Date(t.date).toLocaleString('ru-RU')}</td><td>{categoryName}</td>
                                    <td>{accountName}</td><td>{counterpartyName}</td>
                                    <td style={{ color: amount > 0 ? 'green' : 'red', fontWeight: '500', textAlign: 'right' }}>
                                        {amount > 0 ? '+' : ''}{amount.toLocaleString('ru-RU')}
                                    </td>
                                    <td>{t.description}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

export default CashFlowPage;