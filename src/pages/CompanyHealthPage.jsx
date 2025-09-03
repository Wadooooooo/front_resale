// src/pages/CompanyHealthPage.jsx

import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { getCompanyHealthAnalytics } from '../api';
import './OrdersPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });

function CompanyHealthPage() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getCompanyHealthAnalytics();
                setAnalyticsData(data);
            } catch (err) {
                setError('Не удалось загрузить данные о состоянии компании.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <h2>Загрузка аналитики...</h2>;
    if (error) return <p className="form-message error">{error}</p>;

    const lineChartData = {
        labels: analyticsData.asset_history.map(d => new Date(d.date).toLocaleDateString('ru-RU')),
        datasets: [{
            label: 'Общая стоимость активов',
            data: analyticsData.asset_history.map(d => d.value),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            tension: 0.1
        }]
    };
    
    const capital = analyticsData.capital_structure;
    const pieCapitalData = {
        labels: ['Собственные средства', 'Заемные средства (долги)'],
        datasets: [{
            data: [capital.company_equity, capital.total_liabilities],
            backgroundColor: ['#36A2EB', '#FF6384'],
        }]
    };
    
    const assets = analyticsData.asset_composition;
    const pieAssetsData = {
        labels: ['Деньги в кассе', 'Склад', 'В пути (от поставщика)', 'В пути (клиенту)'],
        datasets: [{
            data: [
                assets.cash_balance, 
                assets.inventory_value, 
                assets.goods_in_transit_value, 
                assets.goods_sent_to_customer_value
            ],
            backgroundColor: ['#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'],
        }]
    };

    const chartOptions = {
        plugins: { legend: { position: 'top' } },
        maintainAspectRatio: false
    };

    return (
        <div>
            <h1>Общее состояние компании</h1>
            
            {/* --- БЛОК С ДИАГРАММАМИ --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                <div className="order-page-container">
                    <h2>Структура капитала</h2>
                    <p>Показывает, какая часть активов ваша, а какая — заемная.</p>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Doughnut data={pieCapitalData} options={chartOptions} />
                    </div>
                </div>

                <div className="order-page-container">
                    <h2>Состав активов</h2>
                    <p>Показывает, в какой форме находятся ваши активы.</p>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Doughnut data={pieAssetsData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div className="order-page-container">
                <h2>Динамика роста активов</h2>
                 <div style={{ height: '400px' }}>
                    <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                </div>
            </div>
        </div>
    );
}

export default CompanyHealthPage;