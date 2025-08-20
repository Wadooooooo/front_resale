// file: src/pages/StockPage.jsx

import React, { useState, useEffect } from 'react';
import { getPhonesInStock } from '../api';
import './StockPage.css'; // Стили для этой страницы
import placeholderImage from '../assets/placeholder.png'; // Заглушка для фото

const getCountryCodesFromModels = (modelNumbers) => {
    if (!modelNumbers) return [];
    const codes = new Set();
    modelNumbers.forEach(model => {
        const parts = model.split('/');
        if (parts.length > 1) {
            const regionPart = parts[0];
            const twoLetterCode = regionPart.slice(-2);
            if (/^[A-Z]{2}$/.test(twoLetterCode)) {
                codes.add(twoLetterCode);
            } else {
                const oneLetterCode = regionPart.slice(-1);
                if (/^[A-Z]$/.test(oneLetterCode)) {
                    codes.add(oneLetterCode);
                }
            }
        }
    });
    return Array.from(codes);
};

// НОВОЕ: Объект для преобразования ваших кодов в стандартные ISO-коды стран (в нижнем регистре)
const regionToCountryCode = {
    A: 'ca', AA: 'ae', AB: 'eg', AE: 'ae', AF: 'dz', AH: 'bh', AM: 'us', B: 'gb',
    BA: 'gb', BE: 'br', BG: 'bg', BR: 'br', BT: 'gb', BZ: 'br', C: 'ca', CL: 'ca',
    CH: 'cn', CI: 'py', CM: 'hu', CN: 'sk', CR: 'hr', CS: 'cz', CZ: 'cz', D: 'de',
    DM: 'de', DN: 'de', E: 'mx', EE: 'ee', EL: 'ee', ER: 'ie', ET: 'ee', F: 'fr',
    FB: 'fr', FD: 'at', FS: 'fi', GB: 'gr', GH: 'gr', GP: 'pt', GR: 'gr', HB: 'il',
    HC: 'hu', HN: 'in', HU: 'hu', HX: 'uz', ID: 'id', IN: 'in', IP: 'it', J: 'jp',
    JP: 'jp', K: 'se', KG: 'gr', KH: 'kr', KN: 'dk', KS: 'fi', LA: 'pe', LE: 'ar',
    LL: 'us', LP: 'pl', LT: 'lt', LV: 'lv', LZ: 'cl', MG: 'hu', MM: 'me', MO: 'mo',
    MY: 'my', ND: 'nl', NF: 'be', PA: 'id', PK: 'fi', PL: 'pl', PM: 'pl', PO: 'pt',
    PP: 'ph', PY: 'es', PX: 'lt', QB: 'ru', QL: 'it', QN: 'dk', RK: 'kz', RM: 'ru',
    RO: 'ro', RP: 'ru', RR: 'ru', RS: 'ru', RU: 'ru', RX: 'ua', SE: 'rs', SL: 'sk',
    SO: 'za', SU: 'ua', T: 'it', TA: 'tw', TH: 'th', TU: 'tr', TY: 'it', UA: 'ua',
    VC: 'ca', VN: 'vn', X: 'au', Y: 'es', ZA: 'sg', ZD: 'de', ZE: 'ae', ZG: 'dk',
    ZO: 'gb', ZP: 'hk'
};

// ИЗМЕНЕНИЕ: Компонент PhoneCard теперь отображает <img> для флагов
const PhoneCard = ({ phone }) => {
    const regionCodes = getCountryCodesFromModels(phone.model_numbers);
    const isoCodes = regionCodes.map(code => regionToCountryCode[code]).filter(Boolean);
    const uniqueIsoCodes = [...new Set(isoCodes)]; // Убираем дубликаты (например, для RU/RP/RS)

    return (
        <div className="phone-card">
            <div className="phone-card-quantity">
                В наличии: {phone.quantity} шт.
            </div>
            
            <div className="phone-card-image-wrapper">
                <img 
                    src={phone.image_url || placeholderImage} 
                    alt={phone.full_model_name} 
                    className="phone-card-photo" // Добавляем класс для фото
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
                {uniqueIsoCodes.length > 0 && (
                    <div className="phone-card-flags">
                        {uniqueIsoCodes.map((isoCode) => (
                            <img
                                key={isoCode}
                                src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.3/flags/4x3/${isoCode}.svg`}
                                alt={isoCode.toUpperCase()}
                                className="phone-card-flag-image"
                                title={isoCode.toUpperCase()} // Показывает код страны при наведении
                            />
                        ))}
                    </div>
                )}
            </div>

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