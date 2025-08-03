// file: src/pages/StockPage.jsx

import React, { useState, useEffect } from 'react';
import { getPhonesInStock } from '../api';
import './StockPage.css'; // Стили для этой страницы
import placeholderImage from '../assets/placeholder.png'; // Заглушка для фото

// Компонент карточки товара
const PhoneCard = ({ phone }) => {
    // Поскольку карточка теперь общая, клик по ней никуда не ведет.
    // В будущем можно будет сделать так, чтобы по клику открывался
    // список всех телефонов этой модели с их серийными номерами.
    return (
        <div className="phone-card">
            <div className="phone-card-quantity">
                В наличии: {phone.quantity} шт.
            </div>
            <img 
                src={phone.image_url || placeholderImage} 
                alt={phone.full_model_name} 
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
            />
            <h3 className="phone-card-name">{phone.full_model_name}</h3>
            <div className="phone-card-price">
                {phone.price ? `${parseFloat(phone.price).toLocaleString('ru-RU')} руб.` : 'Цена не указана'}
            </div>
        </div>
    );
};

// Основной компонент страницы
function StockPage() {
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPhones = async () => {
            try {
                setLoading(true);
                const data = await getPhonesInStock();
                setPhones(data);
            } catch (err) {
                setError('Не удалось загрузить каталог товаров.');
            } finally {
                setLoading(false);
            }
        };
        loadPhones();
    }, []);

    if (loading) return <h2>Загрузка каталога...</h2>;
    if (error) return <p className="form-message error">{error}</p>;

    return (
        <div>
            <h1>Каталог товаров на складе ({phones.length} моделей)</h1>
            <div className="stock-grid">
                {phones.map(phone => (
                    <PhoneCard key={phone.model_id} phone={phone} />
                ))}
            </div>
        </div>
    );
}

export default StockPage;