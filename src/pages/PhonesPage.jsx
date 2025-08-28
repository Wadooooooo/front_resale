// src/pages/PhonesPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPhones } from '../api';
import './OrdersPage.css';

// Компонент для вкладки со списком телефонов
const PhoneListTab = () => {
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Состояния для пагинации
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 25; // Количество телефонов на одной странице

    useEffect(() => {
        const fetchPhones = async () => {
            try {
                setLoading(true);
                const skip = (page - 1) * PAGE_SIZE;
                
                // Запрашиваем данные для конкретной страницы
                const data = await getPhones(skip, PAGE_SIZE);
                
                // Сохраняем список телефонов из `data.items`
                setPhones(data.items); 
                
                // Рассчитываем общее количество страниц
                setTotalPages(Math.ceil(data.total / PAGE_SIZE));

            } catch (err) {
                console.error('Ошибка при загрузке телефонов:', err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPhones();
    }, [navigate, page]); // Перезагружаем данные при смене страницы

    if (loading) return <h4>Загрузка списка телефонов...</h4>;

    return (
        <>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Модель</th>
                        <th>S/N</th>
                        <th>Коммерческий статус</th>
                    </tr>
                </thead>
                <tbody>
                    {phones.map(phone => (
                        <tr key={phone.id}>
                            <td>{phone.id}</td>
                            <td>{phone.model?.name || '-'}</td>
                            <td>
                                {phone.serial_number ? (
                                    <Link to={`/phone-history/${phone.serial_number}`} className="clickable-sn">
                                        {phone.serial_number}
                                    </Link>
                                ) : ('-')}
                            </td>
                            <td>{phone.commercial_status || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Блок с кнопками пагинации */}
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
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
};


// Компонент для вкладки создания телефона (остается без изменений)
const CreatePhoneTab = () => {
    // Здесь может быть ваша логика для создания телефона
    return (
        <div>
            <h2>Добавить телефон вручную</h2>
            <p>Этот раздел находится в разработке.</p>
        </div>
    );
};


// Основной компонент страницы
function PhonesPage() {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div>
            <h1>Телефоны</h1>
            <div className="order-page-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        Список телефонов
                    </button>
                    {/* <button
                        className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Добавить телефон
                    </button> */}
                </div>
                {activeTab === 'list' && <PhoneListTab />}
                {activeTab === 'create' && <CreatePhoneTab />}
            </div>
        </div>
    );
}

export default PhonesPage;