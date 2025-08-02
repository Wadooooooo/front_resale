import React, { useState, useEffect } from 'react';
import { getModelStorageCombos, getAllAccessories, setPriceForPhoneCombo, addAccessoryPrice } from '../api';
import { printPriceList } from '../utils/printPriceList'; // 1. ИМПОРТИРУЕМ ФУНКЦИЮ ПЕЧАТИ
import './OrdersPage.css';

function PricingPage() {
    const [modelCombos, setModelCombos] = useState([]);
    const [accessories, setAccessories] = useState([]);
    const [newPhonePrices, setNewPhonePrices] = useState({});
    const [newAccessoryPrices, setNewAccessoryPrices] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [modelCombosData, accessoriesData] = await Promise.all([
                    getModelStorageCombos(),
                    getAllAccessories()
                ]);
                setModelCombos(modelCombosData);
                setAccessories(accessoriesData);
            } catch (err) {
                setMessage('Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 2. ДОБАВЛЯЕМ ОБРАБОТЧИК ДЛЯ КНОПКИ ПЕЧАТИ
    const handlePrint = () => {
        printPriceList(modelCombos);
    };

    const handleAccessoryPriceChange = (accessoryId, price) => {
        setNewAccessoryPrices({ ...newAccessoryPrices, [accessoryId]: price });
    };

    const handleSaveAccessoryPrice = async (accessoryId) => {
        const newPrice = newAccessoryPrices[accessoryId];
        if (!newPrice) return;
        try {
            await addAccessoryPrice(accessoryId, { price: parseFloat(newPrice) });
            setAccessories(prev => prev.map(acc => acc.id === accessoryId ? { ...acc, current_price: parseFloat(newPrice) } : acc));
            setNewAccessoryPrices(prev => ({ ...prev, [accessoryId]: '' }));
            setMessage(`Цена для аксессуара успешно обновлена!`);
        } catch (err) {
            setMessage('Ошибка при установке цены.');
        }
    };

    const handlePhonePriceChange = (combo, price) => {
        const key = `${combo.model_name_id}_${combo.storage_id}`;
        setNewPhonePrices({ ...newPhonePrices, [key]: price });
    };

    const handleSavePhonePrice = async (combo) => {
        const key = `${combo.model_name_id}_${combo.storage_id}`;
        const newPrice = newPhonePrices[key];
        if (!newPrice) return;
        const priceData = {
            price: parseFloat(newPrice),
            model_name_id: combo.model_name_id,
            storage_id: combo.storage_id
        };
        try {
            await setPriceForPhoneCombo(priceData);
            setModelCombos(prev => prev.map(c => 
                (c.model_name_id === combo.model_name_id && c.storage_id === combo.storage_id) 
                ? { ...c, current_price: parseFloat(newPrice) } : c
            ));
            setNewPhonePrices(prev => ({ ...prev, [key]: '' }));
            setMessage(`Цена для "${combo.display_name}" успешно обновлена!`);
        } catch (err) {
            setMessage('Ошибка при установке цены.');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Управление Ценами</h1>
                {/* 3. ДОБАВЛЯЕМ САМУ КНОПКУ ПЕЧАТИ */}
                <button onClick={handlePrint} className="btn btn-secondary" style={{marginTop: 0}}>
                    🖨️ Печать ценников
                </button>
            </div>
            {message && <p className="form-message success">{message}</p>}

            <div className="order-page-container">
                <h2>Цены на телефоны</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Модель + Память</th>
                            <th>Текущая цена (руб.)</th>
                            <th>Новая цена (руб.)</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modelCombos.map(combo => {
                            const key = `${combo.model_name_id}_${combo.storage_id}`;
                            return (
                                <tr key={key}>
                                    <td>{combo.display_name}</td>
                                    <td>{combo.current_price || 'Не установлена'}</td>
                                    <td>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-input form-input-compact"
                                            placeholder="Введите цену"
                                            value={newPhonePrices[key] || ''}
                                            onChange={e => handlePhonePriceChange(combo, e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-compact"
                                            onClick={() => handleSavePhonePrice(combo)}
                                        >
                                            Сохранить
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* TODO: Сделать такую же таблицу для аксессуаров */}
            <div className="order-page-container">
                <h2>Цены на аксессуары</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Аксессуар</th>
                            <th>Текущая цена (руб.)</th>
                            <th>Новая цена (руб.)</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accessories.map(accessory => {
                            const key = accessory.id;
                            return (
                                <tr key={key}>
                                    <td>{accessory.name}</td>
                                    <td>{accessory.current_price || 'Не установлена'}</td>
                                    <td>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-input form-input-compact" 
                                            placeholder="Введите цену"
                                            value={newAccessoryPrices[key] || ''}
                                            onChange={e => handleAccessoryPriceChange(key, e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-compact"
                                            onClick={() => handleSaveAccessoryPrice(key)}
                                        >
                                            Сохранить
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PricingPage;