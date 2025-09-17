// src/pages/ReturnsPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
    getDefectivePhones, 
    getSuppliers,
    createReturnShipment,
    getReturnShipments,
    getPhonesSentToSupplier,
    createSdekOrderForReturn,
    getAddressSuggestions
} from '../api';
import './OrdersPage.css';
import { IMaskInput } from 'react-imask';
import AsyncSelect from 'react-select/async';

// Модальное окно для создания новой отправки
const CreateShipmentModal = ({ phones, suppliers, onClose, onCreated }) => {
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [trackNumber, setTrackNumber] = useState('');
    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSupplier) {
            alert('Выберите поставщика.');
            return;
        }
        try {
            const shipmentData = {
                supplier_id: selectedSupplier.value,
                phone_ids: phones.map(p => p.id),
                track_number: trackNumber || null
            };
            await createReturnShipment(shipmentData);
            onCreated();
        } catch (err) {
            alert(err.response?.data?.detail || 'Не удалось создать отправку.');
        }
    };

    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>Новая отправка поставщику</h3>
                <p>Будет создана отправка из <strong>{phones.length}</strong> устройств.</p>
                <div className="form-section">
                    <label>Поставщик*</label>
                    <Select options={supplierOptions} value={selectedSupplier} onChange={setSelectedSupplier} placeholder="Выберите..." required />
                </div>
                <div className="form-section">
                    <label>Трек-номер (если есть)</label>
                    <input type="text" value={trackNumber} onChange={e => setTrackNumber(e.target.value)} className="form-input" />
                </div>
                <div className="confirm-modal-buttons">
                    <button type="submit" className="btn btn-primary">Создать и отправить</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </form>
        </div>
    );
};

const SdekReturnModal = ({ shipment, onClose, onCreated }) => {
    const [recipientName, setRecipientName] = useState(shipment.supplier.name || '');
    const [recipientPhone, setRecipientPhone] = useState(shipment.supplier.contact_info || '');
    // Для адреса используем объект, как требует react-select
    const [toLocationAddress, setToLocationAddress] = useState(
        shipment.supplier.address ? { label: shipment.supplier.address, value: shipment.supplier.address } : null
    );
    const [dims, setDims] = useState({ weight: '', length: '10', width: '10', height: '10' });
    const [declaredValue, setDeclaredValue] = useState('2000');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDims(prev => ({ ...prev, [name]: value }));
    };

    // Функция для загрузки подсказок от DaData
    const loadAddressOptions = (inputValue, callback) => {
        setTimeout(async () => {
            if (!inputValue || inputValue.length < 3) {
                callback([]);
                return;
            }
            try {
                const suggestions = await getAddressSuggestions(inputValue);
                const options = suggestions.map(s => ({ value: s.value, label: s.value }));
                callback(options);
            } catch (error) {
                callback([]);
            }
        }, 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recipientName || !toLocationAddress) {
            alert('Имя и адрес получателя обязательны.');
            return;
        }
        try {
            const dataToSend = {
                // Габариты
                weight: parseInt(dims.weight),
                length: parseInt(dims.length),
                width: parseInt(dims.width),
                height: parseInt(dims.height),
                // Данные получателя
                recipient_name: recipientName,
                recipient_phone: recipientPhone,
                to_location_address: toLocationAddress.value,
                declared_value: parseFloat(declaredValue)
            };
            const response = await createSdekOrderForReturn(shipment.id, dataToSend);
            onCreated(response.track_number);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при создании заказа в СДЭК.');
        }
    };
    
    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '600px' }}>
                <h3>Создать заказ в СДЭК для отправки №{shipment.id}</h3>
                
                <h4>Получатель (Поставщик)</h4>
                <div className="form-section">
                    <label>Имя*</label>
                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="form-input" required />
                </div>
                 <div className="form-section">
                    <label>Телефон*</label>
                    <IMaskInput
                        mask="+7 (000) 000-00-00"
                        value={recipientPhone}
                        onAccept={(value) => setRecipientPhone(value)}
                        className="form-input"
                        placeholder="+7 (___) ___-__-__"
                        required
                    />
                </div>
                <div className="form-section">
                    <label>Адрес (начните вводить для подсказки)*</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadAddressOptions}
                        defaultOptions
                        value={toLocationAddress}
                        onChange={setToLocationAddress}
                        placeholder="Город, улица, дом..."
                        required
                    />
                </div>

                <h4 style={{marginTop: '2rem'}}>Габариты посылки</h4>
                <div className="details-grid">
                    <div className="form-section">
                        <label>Объявленная стоимость*</label>
                        <input type="number" name="declared_value" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-section"><label>Вес (граммы)*</label><input type="number" name="weight" value={dims.weight} onChange={handleChange} className="form-input" required /></div>
                    <div className="form-section"><label>Длина (см)*</label><input type="number" name="length" value={dims.length} onChange={handleChange} className="form-input" required /></div>
                    <div className="form-section"><label>Ширина (см)*</label><input type="number" name="width" value={dims.width} onChange={handleChange} className="form-input" required /></div>
                    <div className="form-section"><label>Высота (см)*</label><input type="number" name="height" value={dims.height} onChange={handleChange} className="form-input" required /></div>
                </div>

                <div className="confirm-modal-buttons">
                    <button type="submit" className="btn btn-primary">Создать</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </form>
        </div>
    );
};


// Компонент для отображения одной отправки
const ShipmentCard = ({ shipment, onSdekCreate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="order-page-container" style={{padding: '1.5rem'}}>
            <div onClick={() => setIsExpanded(!isExpanded)} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h4>Отправка №{shipment.id} от {new Date(shipment.created_date).toLocaleDateString('ru-RU')}</h4>
                    <p style={{margin: 0}}>
                        Поставщик: <strong>{shipment.supplier.name}</strong> | 
                        Статус: <strong>{shipment.status}</strong> | 
                        Телефонов: <strong>{shipment.items.length}</strong>
                    </p>
                    {shipment.track_number && <p style={{margin: '5px 0 0 0'}}>Трек: <strong>{shipment.track_number}</strong></p>}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    {/* НОВАЯ КНОПКА */}
                    {!shipment.sdek_track_number && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSdekCreate(shipment); }} 
                            className="btn btn-info btn-compact" style={{backgroundColor: '#0dcaf0', width: 'auto'}}
                        >
                            Создать в СДЭК
                        </button>
                    )}
                    <span style={{fontSize: '1.5rem'}}>{isExpanded ? '▲' : '▼'}</span>
                </div>
                <span style={{fontSize: '1.5rem'}}>{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <div style={{marginTop: '1rem'}}>
                    <h5>Состав отправки:</h5>
                    <ul style={{paddingLeft: '20px', margin: 0}}>
                        {shipment.items.map(item => (
                            <li key={item.phone.id}>
                                {item.phone.model?.name || 'Модель не указана'} (S/N: {item.phone.serial_number})
                            </li>
                        ))}
                    </ul>
                </div>
                
            )}
            
        </div>
    );
};

// Основной компонент страницы, который выводит все блоки
function ReturnsPage() {
    const [defectivePhones, setDefectivePhones] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [phonesSentToSupplier, setPhonesSentToSupplier] = useState([]);
    const [shipmentForSdek, setShipmentForSdek] = useState(null); 

    const loadData = async () => {
        try {
            setLoading(true);
            const [defectiveData, suppliersData, shipmentsData, sentPhonesData] = await Promise.all([
                getDefectivePhones(), 
                getSuppliers(), 
                getReturnShipments(),
                getPhonesSentToSupplier()
            ]);
            setDefectivePhones(defectiveData);
            setSuppliers(suppliersData);
            setShipments(shipmentsData);
            setPhonesSentToSupplier(sentPhonesData);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSdekCreated = (trackNumber) => {
        // Просто закрываем окно и перезагружаем данные, чтобы увидеть новый трек-номер
        setShipmentForSdek(null);
        loadData(); 
    };
    const handleCheckboxChange = (phoneId) => setSelectedPhoneIds(prev => prev.includes(phoneId) ? prev.filter(id => id !== phoneId) : [...prev, phoneId]);
    const handleShipmentCreated = () => { setIsModalOpen(false); setSelectedPhoneIds([]); loadData(); };
    const selectedPhones = defectivePhones.filter(p => selectedPhoneIds.includes(p.id));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            {isModalOpen && <CreateShipmentModal phones={selectedPhones} suppliers={suppliers} onClose={() => setIsModalOpen(false)} onCreated={handleShipmentCreated} />}
            {shipmentForSdek && <SdekReturnModal shipment={shipmentForSdek} onClose={() => setShipmentForSdek(null)} onCreated={handleSdekCreated} />}
            <h1>Брак и возвраты поставщику</h1>

            <div className="order-page-container">
                <h2>Брак на складе ({defectivePhones.length})</h2>
                <table className="orders-table">
                    <thead><tr><th style={{width: '50px'}}>Выбрать</th><th>ID</th><th>Модель</th><th>S/N</th><th>Причина брака</th></tr></thead>
                    <tbody>
                        {defectivePhones.map(phone => (
                            <tr key={phone.id}>
                                <td><input type="checkbox" checked={selectedPhoneIds.includes(phone.id)} onChange={() => handleCheckboxChange(phone.id)} /></td>
                                <td>{phone.id}</td><td>{phone.model?.name || 'Нет данных'}</td><td>{phone.serial_number}</td><td>{phone.defect_reason || 'Не указана'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" disabled={selectedPhoneIds.length === 0}>
                    Создать отправку для выбранных ({selectedPhoneIds.length})
                </button>
            </div>

            <div>
                <h2>История отправок</h2>
                {shipments.map(shipment => (
                    <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        onSdekCreate={setShipmentForSdek} 
                    />
                ))}
            </div>
            
            <div className="order-page-container">
                <h2>Телефоны у поставщика ({phonesSentToSupplier.length})</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Модель</th><th>S/N</th><th>Причина отправки</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phonesSentToSupplier.map(phone => (
                            <tr key={phone.id}>
                                <td>{phone.id}</td>
                                <td>{phone.model?.name || 'Нет данных'}</td>
                                <td>{phone.serial_number}</td>
                                <td>{phone.defect_reason || 'Не указана'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReturnsPage;