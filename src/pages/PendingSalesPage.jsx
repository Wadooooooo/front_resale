// src/pages/PendingSalesPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getPendingSales, finalizeSale, getAccounts } from '../api';
import './OrdersPage.css';

const FinalizeModal = ({ sale, accounts, onClose, onFinalize }) => {
    const [selectedAccount, setSelectedAccount] = useState(null);

    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    const handleSubmit = () => {
        if (!selectedAccount) {
            alert('Пожалуйста, выберите счет для зачисления.');
            return;
        }
        onFinalize(sale.id, selectedAccount.value);
    };

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog">
                <h3>Подтвердить оплату по продаже №{sale.id}</h3>
                <p>Сумма: <strong>{sale.total_amount.toLocaleString('ru-RU')} руб.</strong></p>
                <div className="form-section" style={{ textAlign: 'left' }}>
                    <label>Счет зачисления*</label>
                    <Select
                        options={accountOptions}
                        value={selectedAccount}
                        onChange={setSelectedAccount}
                        placeholder="Выберите счёт..." 
                    />
                </div>
                <div className="confirm-modal-buttons">
                    <button onClick={handleSubmit} className="btn btn-primary">Подтвердить</button>
                    <button onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </div>
        </div>
    );
};

function PendingSalesPage() {
    const [sales, setSales] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saleToFinalize, setSaleToFinalize] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, accountsData] = await Promise.all([getPendingSales(), getAccounts()]);
            setSales(salesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error("Ошибка загрузки данных", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFinalize = async (saleId, accountId) => {
        try {
            await finalizeSale(saleId, accountId);
            setSaleToFinalize(null);
            loadData(); // Обновляем список
        } catch (error) {
            alert('Не удалось завершить продажу.');
        }
    };
    
    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            {saleToFinalize && (
                <FinalizeModal 
                    sale={saleToFinalize}
                    accounts={accounts}
                    onClose={() => setSaleToFinalize(null)}
                    onFinalize={handleFinalize}
                />
            )}
            <h1>Продажи в ожидании оплаты ({sales.length})</h1>
            <div className="order-page-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дата</th>
                            <th>Товары</th>
                            <th>Сумма</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <tr key={sale.id}>
                                <td>{sale.id}</td>
                                <td>{new Date(sale.sale_date).toLocaleString('ru-RU')}</td>
                                <td>
                                    <ul>
                                        {sale.details.map(d => <li key={d.id}>{d.product_name}</li>)}
                                    </ul>
                                </td>
                                <td>{sale.total_amount.toLocaleString('ru-RU')} руб.</td>
                                <td>
                                    <button onClick={() => setSaleToFinalize(sale)} className="btn btn-primary">
                                        Подтвердить оплату
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PendingSalesPage;