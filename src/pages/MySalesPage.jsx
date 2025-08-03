// file: src/pages/MySalesPage.jsx

import React, { useState, useEffect } from 'react';
import { getMySales } from '../api';
import './OrdersPage.css';

const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('ru-RU');
};

// Функция для получения даты в формате YYYY-MM-DD
const toISODateString = (date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
};

function MySalesPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояния для фильтра по дате
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1)))); // Первый день текущего месяца
    const [endDate, setEndDate] = useState(toISODateString(new Date())); // Сегодня

    const fetchSales = async () => {
        try {
            setLoading(true);
            const data = await getMySales(startDate, endDate);
            setSales(data);
        } catch (err) {
            setError('Не удалось загрузить ваши продажи.');
        } finally {
            setLoading(false);
        }
    };

    // Загружаем данные при первом рендере и при нажатии на кнопку
    useEffect(() => {
        fetchSales();
    }, []); // Пустой массив, чтобы сработал только один раз при загрузке

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchSales();
    };

    return (
        <div>
            <h1>Мои продажи</h1>

            <div className="order-page-container">
                <form onSubmit={handleFilterSubmit}>
                    <h2>Фильтр по периоду</h2>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>С даты:</label>
                            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="form-section">
                            <label>По дату:</label>
                            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Применить'}
                    </button>
                </form>
            </div>

            {error && <p className="form-message error">{error}</p>}

            <div className="order-page-container">
                {loading ? (
                    <h2>Загрузка...</h2>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Дата</th>
                                <th>Товары</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{formatDateTime(sale.sale_date)}</td>
                                    <td>
                                        <ul>
                                            {sale.details.map(detail => (
                                                <li key={detail.id}>
                                                    {detail.product_name} ({detail.quantity} шт.)
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>{parseFloat(sale.total_amount).toLocaleString('ru-RU')} руб.</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4">Продаж за выбранный период не найдено.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MySalesPage;