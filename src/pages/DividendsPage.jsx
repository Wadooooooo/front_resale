// src/pages/DividendsPage.jsx

import React, { useState, useEffect } from 'react';
import { getDividendCalculations } from '../api'; // Убедитесь, что создали эту функцию в api.js
import './OrdersPage.css';

const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('ru-RU');

function DividendsPage() {
    const [calculations, setCalculations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getDividendCalculations();
                setCalculations(data);
            } catch (err) {
                setError('Не удалось загрузить расчеты дивидендов.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <h2>Загрузка...</h2>;
    if (error) return <p className="form-message error">{error}</p>;

    return (
        <div>
            <h1>Расчет дивидендов</h1>
            <div className="order-page-container">
                <h2>История расчетов</h2>
                <p style={{ marginTop: '-1rem', color: '#6c757d' }}>
                    Новый расчет появляется автоматически после создания финансового среза, если за период была прибыль.
                </p>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Дата расчета</th>
                            <th style={{ textAlign: 'right' }}>Прибыль за период</th>
                            <th style={{ textAlign: 'right' }}>Реинвест (50%)</th>
                            <th style={{ textAlign: 'right' }}>Дивиденды (50%)</th>
                            <th style={{ textAlign: 'right' }}>Доля партнера 1</th>
                            <th style={{ textAlign: 'right' }}>Доля партнера 2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculations.map(calc => (
                            <tr key={calc.id}>
                                <td>{formatDate(calc.calculation_date)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(calc.total_profit)}</td>
                                <td style={{ textAlign: 'right', color: '#6c757d' }}>{formatCurrency(calc.reinvestment_amount)}</td>
                                <td style={{ textAlign: 'right', color: '#198754', fontWeight: 'bold' }}>{formatCurrency(calc.dividends_amount)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(calc.owner_dividends?.owner_1_share || 0)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(calc.owner_dividends?.owner_2_share || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DividendsPage;