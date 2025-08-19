// src/pages/FinancialAnalyticsPage.jsx

import React, { useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { getFinancialAnalytics, getSalesByDate, getCashflowByDate } from '../api'; 
import './OrdersPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const toISODateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

// --- НОВЫЙ КОМПОНЕНТ: Модальное окно для детализации ---
const DetailsModal = ({ date, onClose }) => {
    const [sales, setSales] = useState([]);
    const [cashflow, setCashflow] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const loadDetails = async () => {
            try {
                setLoading(true);
                const [salesData, cashflowData] = await Promise.all([
                    getSalesByDate(date),
                    getCashflowByDate(date)
                ]);
                setSales(salesData);
                setCashflow(cashflowData);
            } catch (err) {
                console.error("Ошибка загрузки деталей дня", err);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [date]);

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>Детализация за {new Date(date + 'T00:00:00').toLocaleDateString('ru-RU')}</h3>
                {loading ? <p>Загрузка...</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4>Продажи ({sales.length})</h4>
                            {sales.map(sale => (
                                <div key={sale.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                    <strong>Чек №{sale.id}</strong> на <strong>{parseFloat(sale.total_amount).toLocaleString('ru-RU')} руб.</strong>
                                    <ul>{sale.details.map(d => <li key={d.id}>{d.product_name}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4>Движение денег ({cashflow.length})</h4>
                             <table className="orders-table">
                                <tbody>
                                    {cashflow.map(cf => (
                                        <tr key={cf.id}>
                                            <td>{cf.operation_category?.name || 'Без категории'}</td>
                                            <td style={{ color: cf.amount > 0 ? 'green' : 'red', textAlign: 'right' }}>
                                                {parseFloat(cf.amount).toLocaleString('ru-RU')} руб.
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                <div className="confirm-modal-buttons">
                    <button onClick={onClose} className="btn btn-primary">Закрыть</button>
                </div>
            </div>
        </div>
    );
};


function FinancialAnalyticsPage() {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(toISODateString(new Date(new Date().setDate(1))));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));
    
    // --- НОВОЕ СОСТОЯНИЕ ДЛЯ МОДАЛЬНОГО ОКНА ---
    const [modalDate, setModalDate] = useState(null);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getFinancialAnalytics(startDate, endDate);

            const allDates = [...new Set([
                ...data.revenue_series.map(d => d.date),
                ...data.expense_series.map(d => d.date),
                ...data.profit_series.map(d => d.date)
            ])].sort();

            const revenueMap = new Map(data.revenue_series.map(d => [d.date, d.value]));
            const expenseMap = new Map(data.expense_series.map(d => [d.date, d.value]));
            const profitMap = new Map(data.profit_series.map(d => [d.date, d.value]));

            const lineChartData = {
                labels: allDates,
                datasets: [
                    { label: 'Выручка', data: allDates.map(date => revenueMap.get(date) || 0), borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },
                    { label: 'Расходы', data: allDates.map(date => expenseMap.get(date) || 0), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },
                    { label: 'Прибыль', data: allDates.map(date => profitMap.get(date) || 0), borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },
                ]
            };

            const pieChartData = {
                labels: data.expense_breakdown.map(d => d.category),
                datasets: [{
                    data: data.expense_breakdown.map(d => d.total),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                        '#E7E9ED', '#8D6E63', '#26A69A', '#D4E157', '#FF7043', '#78909C'
                    ],
                }]
            };

            setChartData({ line: lineChartData, pie: pieChartData });
        } catch (err) {
            setError('Не удалось загрузить аналитику.');
        } finally {
            setLoading(false);
        }
    };

    const pieChartOptions = {
        plugins: {
            legend: {
                position: 'top', // Размещаем легенду сверху
            },
            title: {
                display: true,
                text: 'Структура расходов' // Добавляем заголовок прямо в диаграмму
            }
        },
        maintainAspectRatio: false // Позволяет диаграмме лучше заполнять контейнер
    };

    
    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ КЛИКА ПО ГРАФИКУ ---
    const handleChartClick = (event, elements) => {
        if (elements && elements.length > 0) {
            const elementIndex = elements[0].index;
            const clickedDate = chartData.line.labels[elementIndex];
            setModalDate(clickedDate);
        }
    };
    
    // --- Опции для графика с обработчиком клика ---
    const lineChartOptions = {
        onClick: handleChartClick,
        plugins: {
            title: { display: true, text: 'Динамика по дням (нажмите на точку для детализации)' }
        },
        maintainAspectRatio: false
    };

    return (
        <div>
            {/* --- Вызов модального окна --- */}
            {modalDate && <DetailsModal date={modalDate} onClose={() => setModalDate(null)} />}

            <h1>Финансовая аналитика</h1>
            <div className="order-page-container">
                <div className="details-grid">
                     <div className="form-section"><label>Дата начала:</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                     <div className="form-section"><label>Дата окончания:</label><input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>{loading ? 'Загрузка...' : 'Сформировать'}</button>
            </div>
            {error && <p className="form-message error">{error}</p>}
            {!loading && chartData && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                    <div className="order-page-container">
                        <div style={{ height: '500px' }}> {/* Обертка для задания высоты */}
                            <Line data={chartData.line} options={lineChartOptions} />
                        </div>
                    </div>
                    <div className="order-page-container">
                        <h2>Структура расходов</h2>
                        <div style={{ height: '500px', position: 'relative' }}> 
                            <Pie data={chartData.pie} options={pieChartOptions} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default FinancialAnalyticsPage;