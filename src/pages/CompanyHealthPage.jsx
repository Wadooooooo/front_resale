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
    const pieChartData = {
        labels: ['Собственные средства', 'Заемные средства (долги)'],
        datasets: [{
            data: [capital.company_equity, capital.total_liabilities],
            backgroundColor: ['#36A2EB', '#FF6384'],
            hoverBackgroundColor: ['#36A2EB', '#FF6384']
        }]
    };

    return (
        <div>
            <h1>Общее состояние компании</h1>
            <div className="order-page-container">
                <h2>Структура капитала</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ position: 'relative', height: '250px', width: '250px' }}>
                        <Doughnut data={pieChartData} />
                    </div>
                    <div>
                        <div className="balance-card">
                            <h4>Собственный капитал</h4>
                            <p className="balance-positive">{formatCurrency(capital.company_equity)}</p>
                        </div>
                         <div className="balance-card" style={{marginTop: '1rem'}}>
                            <h4>Обязательства (долги)</h4>
                            <p className="balance-negative">{formatCurrency(capital.total_liabilities)}</p>
                        </div>
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