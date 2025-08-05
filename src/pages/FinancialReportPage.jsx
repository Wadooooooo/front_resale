import React, { useState, useEffect } from 'react';
import { getFinancialSnapshots, createFinancialSnapshot } from '../api';
import './OrdersPage.css';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('ru-RU');
const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

function FinancialReportPage() {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getFinancialSnapshots();
            setSnapshots(data);
        } catch (err) {
            setError('Не удалось загрузить отчеты.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateSnapshot = async () => {
        if (!window.confirm('Вы уверены, что хотите создать финансовый срез на сегодняшнюю дату? Это действие можно выполнить только один раз в день.')) {
            return;
        }
        try {
            setMessage('Создание среза...');
            setError('');
            await createFinancialSnapshot();
            setMessage('Срез успешно создан!');
            await loadData(); // Обновляем данные
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось создать срез.');
            setMessage('');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Финансовые срезы (Рост компании)</h1>
            <div className="order-page-container">
                <button onClick={handleCreateSnapshot} className="btn btn-primary">
                    Сделать срез на сегодня
                </button>
                {error && <p className="form-message error" style={{marginTop: '1rem'}}>{error}</p>}
                {message && <p className="form-message success" style={{marginTop: '1rem'}}>{message}</p>}
            </div>

            <div className="order-page-container">
                <h2>История</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Дата среза</th>
                            <th style={{textAlign: 'right'}}>Деньги в кассе</th>
                            <th style={{textAlign: 'right'}}>Стоимость склада</th>
                            <th style={{textAlign: 'right'}}>Товары в пути</th>
                            <th style={{textAlign: 'right'}}>ИТОГО АКТИВЫ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {snapshots.map(s => (
                            <tr key={s.id}>
                                <td>{formatDate(s.snapshot_date)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.cash_balance)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.inventory_value)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.goods_in_transit_value)}</td>
                                <td style={{textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(s.total_assets)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default FinancialReportPage;