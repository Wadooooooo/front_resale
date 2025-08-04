// src/pages/WarehousePage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { 
    getShops, 
    getPhonesReadyForStock, 
    acceptPhonesToWarehouse,
    getAllPhonesInStockDetailed,
    movePhoneLocation
} from '../api';
import './OrdersPage.css';
import './AccessoriesPage.css';

// Компонент для вкладки "Приёмка"
const AcceptanceTab = () => {
    const [shops, setShops] = useState([]);
    const [phones, setPhones] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState('');
    const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            setMessage('');
            const [shopsData, phonesData] = await Promise.all([getShops(), getPhonesReadyForStock()]);
            setShops(shopsData);
            setPhones(phonesData);
        } catch (error) { 
            setMessage('Ошибка загрузки данных для приёмки'); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCheckboxChange = (phoneId) => {
        setSelectedPhoneIds(prev => prev.includes(phoneId) ? prev.filter(id => id !== phoneId) : [...prev, phoneId]);
    };

    const handleAccept = async () => {
        if (!selectedShopId || selectedPhoneIds.length === 0) {
            alert('Пожалуйста, выберите магазин и хотя бы один телефон.');
            return;
        }
        try {
            await acceptPhonesToWarehouse({ phone_ids: selectedPhoneIds, shop_id: parseInt(selectedShopId) });
            setMessage(`${selectedPhoneIds.length} телефон(ов) успешно приняты на склад.`);
            setSelectedPhoneIds([]);
            loadData();
        } catch (error) { 
            setMessage('Ошибка при приемке телефонов на склад.'); 
        }
    };
    
    if (loading) return <h3>Загрузка...</h3>;

    return (
        <div>
            <div className="form-section" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                <label>Выберите магазин для приёмки:</label>
                <select className="form-select" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
                    <option value="">-- Выберите магазин --</option>
                    {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                    ))}
                </select>
            </div>
            
            <h3>Готовые к приёмке телефоны ({phones.length})</h3>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Выбрать</th>
                        <th>ID</th>
                        <th>Модель</th>
                        <th>S/N</th>
                    </tr>
                </thead>
                <tbody>
                    {phones.map(phone => (
                        <tr key={phone.id}>
                            <td>
                                <input 
                                    type="checkbox"
                                    checked={selectedPhoneIds.includes(phone.id)}
                                    onChange={() => handleCheckboxChange(phone.id)}
                                />
                            </td>
                            <td>{phone.id}</td>
                            <td>{phone.model?.name || 'Нет данных'}</td>
                            <td>{phone.serial_number}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button 
                onClick={handleAccept} 
                className="btn btn-primary" 
                disabled={!selectedShopId || selectedPhoneIds.length === 0}
            >
                Принять выбранные ({selectedPhoneIds.length})
            </button>
            {message && <p className="form-message success" style={{ marginTop: '1rem' }}>{message}</p>}
        </div>
    );
};

// Компонент для вкладки "Перемещение"
const MovementTab = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [filter, setFilter] = useState('ALL');

    // Новые состояния для модального окна
    const [isAddLoanerModalOpen, setIsAddLoanerModalOpen] = useState(false);
    const [selectedPhoneToMove, setSelectedPhoneToMove] = useState(null);

    const loadStock = async () => {
        try {
            setLoading(true);
            setMessage('');
            const data = await getAllPhonesInStockDetailed();
            setStock(data);
        } catch (err) { 
            setMessage('Ошибка загрузки данных о товарах'); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadStock(); }, []);

    const handleMove = async (phoneId, newLocation) => {
        try {
            const updatedPhone = await movePhoneLocation(phoneId, newLocation);
            // Обновляем состояние, чтобы изменение сразу отразилось в таблице
            setStock(prevStock => prevStock.map(p => p.id === phoneId ? updatedPhone : p));
        } catch (err) {
            alert('Не удалось переместить телефон.');
        }
    };

    // Обработчик для кнопки в модальном окне
    const handleAddPhoneToLoanerPool = async () => {
        if (!selectedPhoneToMove) {
            alert('Пожалуйста, выберите телефон.');
            return;
        }
        // Используем уже существующую функцию handleMove
        await handleMove(selectedPhoneToMove.value, 'ПОДМЕННЫЙ_ФОНД');
        // Закрываем окно и сбрасываем выбор
        setIsAddLoanerModalOpen(false);
        setSelectedPhoneToMove(null);
    };

    // Фильтруем список телефонов для таблицы
    const filteredStock = stock.filter(phone => {
        if (filter === 'ALL') return true;
        return phone.storage_location === filter;
    });

    // Готовим список телефонов, которые можно добавить в подменный фонд (т.е. те, что на складе или на витрине)
    const eligibleForLoanerPoolOptions = useMemo(() => 
        stock
            .filter(p => p.storage_location === 'СКЛАД' || p.storage_location === 'ВИТРИНА')
            .map(p => ({
                value: p.id,
                label: `${p.model?.name || 'Модель не указана'} (S/N: ${p.serial_number || 'б/н'})`
            })),
        [stock]
    );

    if (loading) return <h3>Загрузка...</h3>;

    return (
        <div>
            {/* Панель с кнопками-фильтрами и новой кнопкой добавления */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setFilter('ALL')} className={`btn btn-compact ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}>Все ({stock.length})</button>
                <button onClick={() => setFilter('СКЛАД')} className={`btn btn-compact ${filter === 'СКЛАД' ? 'btn-primary' : 'btn-secondary'}`}>На складе ({stock.filter(p=>p.storage_location === 'СКЛАД').length})</button>
                <button onClick={() => setFilter('ВИТРИНА')} className={`btn btn-compact ${filter === 'ВИТРИНА' ? 'btn-primary' : 'btn-secondary'}`}>На витрине ({stock.filter(p=>p.storage_location === 'ВИТРИНА').length})</button>
                <button onClick={() => setFilter('ПОДМЕННЫЙ_ФОНД')} className={`btn btn-compact ${filter === 'ПОДМЕННЫЙ_ФОНД' ? 'btn-primary' : 'btn-secondary'}`}>Подменный фонд ({stock.filter(p=>p.storage_location === 'ПОДМЕННЫЙ_ФОНД').length})</button>
                <button onClick={() => setIsAddLoanerModalOpen(true)} className="btn btn-primary" style={{ marginTop: 0, marginLeft: 'auto' }}>
                    + Добавить в подменный фонд
                </button>
            </div>

            {message && <p className="form-message error">{message}</p>}

            {/* Основная таблица с упрощенными кнопками */}
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Модель</th>
                        <th>S/N</th>
                        <th>Местоположение</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStock.map((phone, index) => (
                        <tr key={`${phone.id}-${index}`}>
                            <td>{phone.id}</td>
                            <td>{phone.model?.name || 'Нет данных'}</td>
                            <td>{phone.serial_number}</td>
                            <td><strong>{phone.storage_location || 'Неизвестно'}</strong></td>
                            <td>
                                {phone.storage_location === 'СКЛАД' ? (
                                    <button onClick={() => handleMove(phone.id, 'ВИТРИНА')} className="btn btn-primary btn-compact">На витрину</button>
                                ) : phone.storage_location === 'ВИТРИНА' ? (
                                    <button onClick={() => handleMove(phone.id, 'СКЛАД')} className="btn btn-secondary btn-compact">На склад</button>
                                ) : phone.storage_location === 'ПОДМЕННЫЙ_ФОНД' ? (
                                    <button onClick={() => handleMove(phone.id, 'СКЛАД')} className="btn btn-secondary btn-compact">На склад</button>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Модальное окно для добавления телефона в подменный фонд */}
            {isAddLoanerModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Добавить телефон в подменный фонд</h3>
                        <div className="form-section" style={{ textAlign: 'left' }}>
                            <label>Выберите устройство со склада или витрины:</label>
                            <Select
                                options={eligibleForLoanerPoolOptions}
                                value={selectedPhoneToMove}
                                onChange={setSelectedPhoneToMove}
                                placeholder="Поиск по модели или S/N..."
                                isClearable
                            />
                        </div>
                        <div className="confirm-modal-buttons">
                            <button onClick={handleAddPhoneToLoanerPool} className="btn btn-primary">Переместить</button>
                            <button onClick={() => setIsAddLoanerModalOpen(false)} className="btn btn-secondary">Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// Основной компонент страницы
function WarehousePage() {
    const [activeTab, setActiveTab] = useState('acceptance');

    return (
        <div>
            <h1>Склад</h1>
            <div className="order-page-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'acceptance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('acceptance')}
                    >
                        Приёмка
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'movement' ? 'active' : ''}`}
                        onClick={() => setActiveTab('movement')}
                    >
                        Перемещение
                    </button>
                </div>
                
                {activeTab === 'acceptance' ? <AcceptanceTab /> : <MovementTab />}
            </div>
        </div>
    );
}

export default WarehousePage;