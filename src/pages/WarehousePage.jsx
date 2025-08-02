import React, { useState, useEffect } from 'react';
import { getShops, getPhonesReadyForStock, acceptPhonesToWarehouse } from '../api';
import './OrdersPage.css'; // Используем те же стили

function WarehousePage() {
    const [shops, setShops] = useState([]);
    const [phones, setPhones] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState('');
    const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const shopsData = await getShops();
            const phonesData = await getPhonesReadyForStock();
            setShops(shopsData);
            setPhones(phonesData);
        } catch (error) {
            setMessage('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCheckboxChange = (phoneId) => {
        setSelectedPhoneIds(prev =>
            prev.includes(phoneId)
                ? prev.filter(id => id !== phoneId)
                : [...prev, phoneId]
        );
    };

    const handleAccept = async () => {
        if (!selectedShopId || selectedPhoneIds.length === 0) {
            alert('Пожалуйста, выберите магазин и хотя бы один телефон.');
            return;
        }
        
        try {
            await acceptPhonesToWarehouse({
                phone_ids: selectedPhoneIds,
                shop_id: parseInt(selectedShopId)
            });
            setMessage(`${selectedPhoneIds.length} телефон(ов) успешно приняты на склад.`);
            setSelectedPhoneIds([]);
            loadData(); // Обновляем список телефонов
        } catch (error) {
            setMessage('Ошибка при приемке телефонов на склад.');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Приёмка Телефонов на Склад</h1>

            <div className="order-page-container">
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
                {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
            </div>
        </div>
    );
}

export default WarehousePage;