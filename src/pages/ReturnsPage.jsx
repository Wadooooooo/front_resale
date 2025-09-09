// src/pages/ReturnsPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
    getDefectivePhones, 
    getSuppliers,
    createReturnShipment,
    getReturnShipments,
    createSdekOrderForReturn
} from '../api';
import './OrdersPage.css';

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

// Компонент для отображения одной отправки
const ShipmentCard = ({ shipment }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCreateSdekOrder = async () => {
        const senderName = window.prompt("Введите имя отправителя (ваше):", "Владислав Садыков");
        if (!senderName) return;

        const senderPhone = window.prompt("Введите телефон отправителя:", "+79010882523");
        if (!senderPhone) return;
        
        const fromAddress = window.prompt("Введите адрес отправки:", "г. Оренбург, пр. Автоматики, 17");
        if (!fromAddress) return;

        const weight = window.prompt("Введите общий вес посылки в граммах:", "1000");
        if (!weight) return;

        // Здесь можно добавить запросы габаритов, если они меняются
        const sdekData = {
            sender_name: senderName,
            sender_phone: senderPhone,
            from_location_address: fromAddress,
            // Адрес получателя (поставщика) нужно будет добавить в форму
            to_location_address: shipment.supplier.contact_info, // Используем контактную информацию
            weight: parseInt(weight),
            length: 10, width: 10, height: 10 // Габариты по умолчанию
        };

        try {
            await createSdekOrderForReturn(shipment.id, sdekData);
            alert('Заказ в СДЭК успешно создан!');
            onSdekCreated(); // Эта функция обновит список отправок
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при создании заказа в СДЭК.');
        }
    };

    return (
        <div className="order-page-container" style={{padding: '1.5rem'}}>
            <div onClick={() => setIsExpanded(!isExpanded)} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}>
                <div>
                    <h4>Отправка №{shipment.id} от {new Date(shipment.created_date).toLocaleDateString('ru-RU')}</h4>
                    <p style={{margin: 0}}>Поставщик: <strong>{shipment.supplier.name}</strong> | Статус: <strong>{shipment.status}</strong></p>
                    {shipment.track_number && <p style={{margin: '5px 0 0 0'}}>Трек: <strong>{shipment.track_number}</strong></p>}
                </div>
                <span style={{fontSize: '1.5rem'}}>{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <ul style={{marginTop: '1rem', paddingLeft: '20px'}}>
                    {shipment.status === "В сборке" && (
                        <button onClick={handleCreateSdekOrder} className="btn btn-info" style={{backgroundColor: '#0dcaf0', marginTop: '1rem'}}>
                            Создать заказ СДЭК
                        </button>
                    )}
                </ul>
            )}
        </div>
    );
}

function ReturnsPage() {
    const [defectivePhones, setDefectivePhones] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [defectiveData, suppliersData, shipmentsData] = await Promise.all([
                getDefectivePhones(),
                getSuppliers(),
                getReturnShipments()
            ]);
            setDefectivePhones(defectiveData);
            setSuppliers(suppliersData);
            setShipments(shipmentsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCheckboxChange = (phoneId) => {
        setSelectedPhoneIds(prev =>
            prev.includes(phoneId) ? prev.filter(id => id !== phoneId) : [...prev, phoneId]
        );
    };
    
    const handleShipmentCreated = () => {
        setIsModalOpen(false);
        setSelectedPhoneIds([]);
        loadData();
    };

    const selectedPhones = defectivePhones.filter(p => selectedPhoneIds.includes(p.id));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            {isModalOpen && <CreateShipmentModal phones={selectedPhones} suppliers={suppliers} onClose={() => setIsModalOpen(false)} onCreated={handleShipmentCreated} />}

            <h1>Брак и возвраты поставщику</h1>

            <div className="order-page-container">
                <h2>Брак на складе ({defectivePhones.length})</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th style={{width: '50px'}}>Выбрать</th>
                            <th>ID</th>
                            <th>Модель</th>
                            <th>S/N</th>
                            <th>Причина брака</th>
                        </tr>
                    </thead>
                    <tbody>
                        {defectivePhones.map(phone => (
                            <tr key={phone.id}>
                                <td><input type="checkbox" checked={selectedPhoneIds.includes(phone.id)} onChange={() => handleCheckboxChange(phone.id)} /></td>
                                <td>{phone.id}</td>
                                <td>{phone.model?.name || 'Нет данных'}</td>
                                <td>{phone.serial_number}</td>
                                <td>{phone.defect_reason || 'Не указана'}</td>
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
                {shipments.map(shipment => 
                    <ShipmentCard 
                        key={shipment.id} 
                        shipment={shipment} 
                        onSdekCreated={loadData} // Передаем функцию для обновления
                    />
                )}
            </div>
        </div>
    );
}

export default ReturnsPage;