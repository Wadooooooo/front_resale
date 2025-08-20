// src/pages/WaitingListPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import { getWaitingList, addToWaitingList, updateWaitingListStatus, getAllModelsFullInfo } from '../api';
import './OrdersPage.css';

const AddToWaitingListModal = ({ isOpen, onClose, onAdded, models }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedModel, setSelectedModel] = useState(null);

    const modelOptions = models.map(m => ({ value: m.id, label: m.name }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerName || !selectedModel) {
            alert('Имя клиента и модель обязательны.');
            return;
        }
        try {
            const data = {
                customer_name: customerName,
                customer_phone: customerPhone,
                model_id: selectedModel.value
            };
            await addToWaitingList(data);
            onAdded(); // Закрыть окно и обновить список
        } catch (error) {
            alert('Ошибка при добавлении в лист ожидания.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '500px' }}>
                <h3>Добавить в лист ожидания</h3>
                <div className="form-section">
                    <label>Имя клиента*</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="form-input" required />
                </div>
                <div className="form-section">
                    <label>Телефон клиента</label>
                     <IMaskInput
                        mask="+7 (000) 000-00-00"
                        value={customerPhone}
                        onAccept={(value) => setCustomerPhone(value)}
                        className="form-input"
                        placeholder="+7 (___) ___-__-__"
                    />
                </div>
                <div className="form-section">
                    <label>Желаемая модель*</label>
                    <Select
                        options={modelOptions}
                        value={selectedModel}
                        onChange={setSelectedModel}
                        placeholder="Выберите модель..."
                        required
                        filterOption={(option, inputValue) =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                        }
                    />
                </div>
                <div className="confirm-modal-buttons">
                    <button type="submit" className="btn btn-primary">Добавить</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </form>
        </div>
    );
};


function WaitingListPage() {
    const [waitingList, setWaitingList] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [listData, modelsData] = await Promise.all([getWaitingList(), getAllModelsFullInfo()]);
            setWaitingList(listData);
            setModels(modelsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleMarkAsDone = async (entryId) => {
        if (window.confirm('Вы уверены, что хотите отметить эту заявку как выполненную? Она будет скрыта из списка.')) {
            try {
                // Статус 2 - completed/cancelled
                await updateWaitingListStatus(entryId, 2);
                await loadData(); // Обновляем список
            } catch (error) {
                alert('Не удалось обновить статус.');
            }
        }
    };

    const handleEntryAdded = () => {
        setIsModalOpen(false);
        loadData();
    };
    
    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
             <AddToWaitingListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdded={handleEntryAdded} models={models} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Лист ожидания</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{marginTop: 0}}>+ Добавить заявку</button>
            </div>

            <div className="order-page-container">
                <h2>Активные заявки ({waitingList.length})</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Клиент</th>
                            <th>Телефон</th>
                            <th>Желаемая модель</th>
                            <th>Кто добавил</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {waitingList.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
                                <td>{item.customer_name}</td>
                                <td>{item.customer_phone}</td>
                                <td>
                                    {`${item.model.model_name?.name || ''} ${item.model.storage?.storage || ''}GB ${item.model.color?.color_name || ''}`.trim()}
                                </td>
                                <td>{item.user.name || item.user.username}</td>
                                <td>
                                    <button onClick={() => handleMarkAsDone(item.id)} className="btn btn-secondary btn-compact">Выполнено</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default WaitingListPage;