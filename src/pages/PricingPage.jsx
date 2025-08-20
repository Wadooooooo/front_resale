import React, { useState, useEffect, useMemo } from 'react';
import { getModelStorageCombos, getAllAccessories, setPriceForPhoneCombo, addAccessoryPrice } from '../api';
import { printPriceList } from '../utils/printPriceList';
import './OrdersPage.css';

// 1. НОВАЯ ФУНКЦИЯ СОРТИРОВКИ
const customPhoneSort = (a, b) => {
    // Определяем порядок поколений от новых к старым
    const modelOrder = [
        'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12',
        'iPhone 11', 'iPhone XS', 'iPhone XR', 'iPhone X',
        'iPhone 8', 'iPhone 7', 'iPhone 6S', 'iPhone 6', 'iPhone 5s'
    ];

    // Вспомогательная функция для извлечения данных из названия
    const parseDisplayName = (displayName) => {
        let generationIndex = 999; // Номер поколения (чем меньше, тем новее)
        let storage = 0;         // Объем памяти в ГБ

        // Находим поколение
        for (let i = 0; i < modelOrder.length; i++) {
            if (displayName.includes(modelOrder[i])) {
                generationIndex = i;
                // Добавляем "вес" для Pro/Plus моделей, чтобы они были выше базовых
                if (displayName.includes('Pro Max')) generationIndex -= 0.3;
                else if (displayName.includes('Pro')) generationIndex -= 0.2;
                else if (displayName.includes('Plus')) generationIndex -= 0.1;
                break;
            }
        }

        // Находим объем памяти
        const storageMatch = displayName.match(/(\d+)\s*(GB|TB)/i);
        if (storageMatch) {
            let value = parseInt(storageMatch[1], 10);
            if (storageMatch[2].toUpperCase() === 'TB') {
                value *= 1024; // Переводим ТБ в ГБ для сравнения
            }
            storage = value;
        }
        
        return { generationIndex, storage };
    };

    const aInfo = parseDisplayName(a.display_name);
    const bInfo = parseDisplayName(b.display_name);

    // Сначала сравниваем по поколению
    if (aInfo.generationIndex !== bInfo.generationIndex) {
        return aInfo.generationIndex - bInfo.generationIndex;
    }

    // Если поколения одинаковые, сравниваем по памяти (от большей к меньшей)
    return bInfo.storage - aInfo.storage;
};


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
    
    // 2. СОЗДАЕМ ОТСОРТИРОВАННЫЙ СПИСОК С ПОМОЩЬЮ useMemo
    const sortedModelCombos = useMemo(() => {
        if (!modelCombos) return [];
        // Создаем копию массива и сортируем его
        return [...modelCombos].sort(customPhoneSort);
    }, [modelCombos]);

    const handlePrint = () => {
        // Печатаем отсортированный список
        printPriceList(sortedModelCombos);
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
                        {/* 3. ИСПОЛЬЗУЕМ ОТСОРТИРОВАННЫЙ СПИСОК ДЛЯ ОТОБРАЖЕНИЯ */}
                        {sortedModelCombos.map(combo => {
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