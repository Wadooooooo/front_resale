// RESALE-FRONTEND/src/pages/OrdersPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { IMaskInput } from 'react-imask';
import {
    getSupplierOrders, createSupplierOrder, getSuppliers, receiveSupplierOrder,
    getAllModelsFullInfo, getUniqueModelNames, getAllAccessoriesInfo, getStorageOptions,
    getColorOptions, paySupplierOrder, getAccounts,createSdekDelivery, calculateSdekCost  ,
    getAddressSuggestions, getPhonesSentToSupplier, refreshSdekStatusForOrder
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';

const formatEnumValueForDisplay = (value) => {
    if (!value) {
        return "";
    }
    if (value === "КРЕДИТ/РАССРОЧКА") {
        return "Кредит/Рассрочка";
    }
    const formattedValue = value.replace(/_/g, ' ').toLowerCase();
    const words = formattedValue.split(' ');
    if (words.length > 0) {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    return words.join(' ');
};

function OrdersPage() {
    // Состояния
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [models, setModels] = useState([]);
    const [uniqueBaseModels, setUniqueBaseModels] = useState([]);
    const [accessories, setAccessories] = useState([]);
    const [storageOptions, setStorageOptions] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const [newOrder, setNewOrder] = useState({
        supplier_id: '',
        details: [{ type: 'model', model_base_id: '', storage_id: '', color_id: '', accessory_id: '', quantity: '1', price: '' }]
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderIdToConfirm, setOrderIdToConfirm] = useState(null);
    const [phonesSentToSupplier, setPhonesSentToSupplier] = useState([]);
    const [returnedWithOrder, setReturnedWithOrder] = useState([]);
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [orderIdToPay, setOrderIdToPay] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAccount, setPaymentAccount] = useState(null);
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const [calculatedCost, setCalculatedCost] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSdekModalOpen, setIsSdekModalOpen] = useState(false);
    const [currentOrderForSdek, setCurrentOrderForSdek] = useState(null);
    const [sdekFormData, setSdekFormData] = useState({
        sender_name: '',
        sender_phone: '',
        from_location_address: '', // Адрес отправителя
        weight: '',
        length: '',
        width: '',
        height: ''
    });

    const handleOpenSdekModal = (order) => {
        setCurrentOrderForSdek(order);
        setCalculatedCost(null); // Сброс
        setIsSdekModalOpen(true);
    };

    const handleCalculateCost = async () => {
        // Проверка, что все поля для расчета заполнены
        const { from_location_address, weight, length, width, height } = sdekFormData;
        if (!from_location_address || !weight || !length || !width || !height) {
            alert('Пожалуйста, заполните адрес отправителя и все габариты для расчета.');
            return;
        }

        setIsCalculating(true);
        setCalculatedCost(null);
        try {
            const dataToCalculate = {
                from_location_address,
                weight: parseInt(weight),
                length: parseInt(length),
                width: parseInt(width),
                height: parseInt(height),
            };
            const result = await calculateSdekCost(dataToCalculate);
            // Отображаем общую стоимость
            setCalculatedCost(result.total_sum);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при расчете стоимости.');
        } finally {
            setIsCalculating(false);
        }
    };

    // Список часто используемых имен
    const quickNames = ["Роман Садыков"]; // Можете добавить любые имена

    const loadAddressOptions = (inputValue, callback) => {
        // Небольшая задержка, чтобы не отправлять запрос на каждую букву
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
                console.error("Ошибка при загрузке подсказок адреса:", error);
                callback([]);
            }
        }, 500); // Задержка в 500 мс
    };

    const handleSdekFormChange = (e) => {
        const { name, value } = e.target;
        setSdekFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSdekSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...sdekFormData,
                weight: parseInt(sdekFormData.weight),
                length: parseInt(sdekFormData.length),
                width: parseInt(sdekFormData.width),
                height: parseInt(sdekFormData.height),
            };
            const response = await createSdekDelivery(currentOrderForSdek.id, dataToSend);
            
            setFormMessage({ type: 'success', text: 'Заказ в СДЭК успешно создан!' });
            setIsSdekModalOpen(false);

            // Обновляем состояние заказов, чтобы кнопка исчезла и появился трек-номер
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === currentOrderForSdek.id 
                    ? { ...order, sdek_track_number: response.track_number, sdek_uuid: response.sdek_uuid } 
                    : order
                )
            );
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Ошибка создания заказа в СДЭК' });
        }
    };
    
    const { hasPermission } = useAuth();

    const loadData = async () => {
        try {
            setLoading(true);
            const basePromises = [
                getSupplierOrders(), getSuppliers(), getAllModelsFullInfo(),
                getAllAccessoriesInfo(), getStorageOptions(), getColorOptions(), getUniqueModelNames(),
            ];
            if (hasPermission('manage_cashflow')) {
                basePromises.push(getAccounts());
            }
            const results = await Promise.all(basePromises);
            setOrders(results[0].sort((a, b) => b.id - a.id));
            setSuppliers(results[1]);
            setModels(results[2]);
            setAccessories(results[3]);
            setStorageOptions(results[4]);
            setColorOptions(results[5]);
            setUniqueBaseModels(results[6]);
            if (hasPermission('manage_cashflow')) {
                setAccounts(results[7] || []);
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
            if (err.response?.status === 401) navigate('/login');
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (hasPermission) loadData();
    }, [navigate, hasPermission]);

    // Обработчики формы
    const handleDetailChange = (index, field, value) => {
        const updatedDetails = newOrder.details.map((detail, i) => {
            if (i === index) {
                const updatedDetail = { ...detail, [field]: value };
                if (field === 'type' || field === 'model_base_id') {
                    updatedDetail.storage_id = '';
                    updatedDetail.color_id = '';
                }
                if (field === 'storage_id') {
                    updatedDetail.color_id = '';
                }
                return updatedDetail;
            }
            return detail;
        });
        setNewOrder({ ...newOrder, details: updatedDetails });
    };
    const addDetailRow = () => setNewOrder({...newOrder, details: [...newOrder.details, { type: 'model', quantity: '1', price: '' }]});
    const removeDetailRow = (index) => setNewOrder({ ...newOrder, details: newOrder.details.filter((_, i) => i !== index) });
    const handleSubmitNewOrder = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: 'Отправка заказа...' });
        try {
            const validDetails = newOrder.details.map(detail => {
                let model_id = null;
                if (detail.type === 'model') {
                    const selectedModel = models.find(m =>
                        m.model_name_id === parseInt(detail.model_base_id) &&
                        m.storage_id === parseInt(detail.storage_id) &&
                        m.color_id === parseInt(detail.color_id)
                    );
                    if (!selectedModel) throw new Error('Не найдена модель для указанной комбинации.');
                    model_id = selectedModel.id;
                }
                return {
                    model_id,
                    accessory_id: detail.type === 'accessory' ? parseInt(detail.accessory_id) : null,
                    quantity: parseInt(detail.quantity),
                    price: parseFloat(detail.price)
                };
            });
            const orderToCreate = { supplier_id: parseInt(newOrder.supplier_id), details: validDetails };
            await createSupplierOrder(orderToCreate);
            setNewOrder({ supplier_id: '', details: [{ type: 'model', quantity: '1', price: '' }] });
            setFormMessage({ type: 'success', text: `Заказ успешно создан!` });
            loadData();
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.detail || err.message });
        }
    };
    
    // Обработчики действий с заказом
    const handleReceiveOrder = async (orderId) => {
        try {
            // Перед открытием окна подгружаем список телефонов, которые числятся у поставщика
            const sentPhones = await getPhonesSentToSupplier();
            setPhonesSentToSupplier(sentPhones);
            setReturnedWithOrder([]); // Сбрасываем выбор
            setOrderIdToConfirm(orderId);
            setIsConfirmModalOpen(true);
        } catch (err) {
            setFormMessage({ type: 'error', text: 'Не удалось загрузить список брака у поставщика.' });
        }
    };

    const handleReturnedCheckboxChange = (phoneId) => {
        setReturnedWithOrder(prev => 
            prev.includes(phoneId) ? prev.filter(id => id !== phoneId) : [...prev, phoneId]
        );
    };

    const confirmAndReceiveOrder = async () => {
        if (!orderIdToConfirm) return;
        try {
            // Отправляем на бэкенд ID заказа и список ID вернувшихся телефонов
            const updatedOrder = await receiveSupplierOrder(orderIdToConfirm, returnedWithOrder);
            setOrders(orders.map(order => order.id === orderIdToConfirm ? updatedOrder : order));
            setFormMessage({ type: 'success', text: `Заказ ID ${orderIdToConfirm} успешно получен!` });
        } catch (err) {
            setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось получить заказ.' });
        } finally {
            setIsConfirmModalOpen(false);
            setOrderIdToConfirm(null);
        }
        }; //
    
        const cancelReceiveOrder = () => {
        setIsConfirmModalOpen(false);
        setOrderIdToConfirm(null);
    }; //
    
        // ДОБАВЛЕНО: Обработчики для модального окна оплаты
        const handlePayOrder = (orderId) => {
            setOrderIdToPay(orderId);
            const orderToPay = orders.find(o => o.id === orderId);
            if (orderToPay) {
                // Суммируем quantity * price для всех деталей заказа
                const totalOrderPrice = orderToPay.details.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                setPaymentAmount(totalOrderPrice.toFixed(2));
            }
            setIsPaymentModalOpen(true);
        };
    
        const confirmAndPayOrder = async () => {
            if (!orderIdToPay || !paymentAccount || parseFloat(paymentAmount) <= 0) {
                setFormMessage({ type: 'error', text: 'Пожалуйста, выберите счет и укажите положительную сумму оплаты.' });
                return;
            }
    
            try {
                const paymentData = {
                    supplier_order_id: orderIdToPay,
                    amount: parseFloat(paymentAmount),
                    account_id: paymentAccount.value, // Берем value из объекта react-select
                    notes: paymentNotes
                    // payment_date будет установлено на бэкенде
                };
                
                // Вызываем новую API-функцию
                const updatedOrder = await paySupplierOrder(orderIdToPay, paymentData);
                
                // Обновляем список заказов в состоянии
                setOrders(prevOrders => prevOrders.map(order => 
                    order.id === orderIdToPay ? updatedOrder : order
                ));
                setFormMessage({ type: 'success', text: `Заказ ID ${orderIdToPay} успешно оплачен!` });
                
                // Сброс формы оплаты
                setOrderIdToPay(null);
                setPaymentAmount('');
                setPaymentAccount(null);
                setPaymentNotes('');
                setIsPaymentModalOpen(false);
                
                // Перезагружаем все данные, чтобы обновились балансы на других страницах (например, CashFlowPage)
                // Это также обновит список заказов, если есть новые.
                const [
                    ordersData, //
                    suppliersData, //
                    modelsData, //
                    accessoriesData, //
                    storageData, //
                    colorData, //
                    uniqueBaseModelsData, //
                    accountsData // ДОБАВЛЕНО: Загружаем счета
                ] = await Promise.all([
                    getSupplierOrders(), //
                    getSuppliers(), //
                    getAllModelsFullInfo(), //
                    getAllAccessoriesInfo(), //
                    getStorageOptions(), //
                    getColorOptions(), //
                    getUniqueModelNames(), //
                    getAccounts() // ДОБАВЛЕНО: Вызываем API для счетов
                ]);
    
                ordersData.sort((a, b) => b.id - a.id);
                setOrders(ordersData);
                setSuppliers(suppliersData);
                setModels(modelsData);
                setUniqueBaseModels(uniqueBaseModelsData);
                setAccessories(accessoriesData);
                setStorageOptions(storageData);
                setColorOptions(colorData);
                setAccounts(accountsData);
    
            } catch (err) {
                console.error('Ошибка при оплате заказа:', err);
                setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось оплатить заказ.' });
            }
        };

        const handleRefreshStatus = async (orderId) => {
            try {
                // Вызываем нашу новую API функцию
                const updatedData = await refreshSdekStatusForOrder(orderId);

                // Обновляем состояние, чтобы изменения сразу отобразились в таблице
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId 
                        ? { ...order, ...updatedData } 
                        : order
                    )
                );
            } catch (error) {
                alert('Не удалось обновить статус. Попробуйте еще раз через минуту.');
            }
        };

        const handleRefreshAllStatuses = async () => {
            setIsRefreshingAll(true); // Включаем состояние загрузки

            // Находим все заказы, которые нужно проверить
            const ordersToRefresh = orders.filter(
                order => order.sdek_order_uuid && !order.sdek_track_number
            );

            if (ordersToRefresh.length === 0) {
                alert('Нет заказов, ожидающих трек-номер.');
                setIsRefreshingAll(false);
                return;
            }

            // Создаем массив промисов для всех запросов
            const refreshPromises = ordersToRefresh.map(order => 
                refreshSdekStatusForOrder(order.id)
                    .then(updatedData => ({...order, ...updatedData})) // Возвращаем обновленный заказ
                    .catch(err => order) // В случае ошибки возвращаем старый заказ
            );

            // Дожидаемся выполнения всех запросов
            const updatedOrdersResults = await Promise.all(refreshPromises);

            // Обновляем общее состояние заказов
            setOrders(prevOrders => 
                prevOrders.map(pOrder => 
                    updatedOrdersResults.find(uOrder => uOrder.id === pOrder.id) || pOrder
                )
            );

            setIsRefreshingAll(false); // Выключаем состояние загрузки
        };
    
        const cancelPayOrder = () => {
            setIsPaymentModalOpen(false);
            setOrderIdToPay(null);
            setPaymentAmount('');
            setPaymentAccount(null);
            setPaymentNotes('');
        };

    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));
    const accessoryOptions = accessories.map(a => ({ value: a.id, label: a.name }));
    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));
    const baseModelOptions = uniqueBaseModels.map(item => ({ value: item.id, label: item.name }));

    if (loading) return <div>Загрузка данных...</div>;
    if (error) return <div className="form-message error">{error}</div>;

    return (
        <div> 
            <h1>Управление Заказами Поставщиков</h1>
            {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}
            
            {hasPermission('manage_inventory') && (
                <div className="order-page-container">
                    <h2>Создать Новый Заказ</h2>
                    <form onSubmit={handleSubmitNewOrder}>
                        <div className="form-section">
                            <label>Поставщик</label>
                            <select className="form-select" value={newOrder.supplier_id} onChange={(e) => setNewOrder({...newOrder, supplier_id: e.target.value})} required>
                                <option value="">Выберите поставщика...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <h3>Детали Заказа</h3>
                        {newOrder.details.map((detail, index) => {
                            const baseModelId = detail.model_base_id ? parseInt(detail.model_base_id, 10) : null;
                            const storageId = detail.storage_id ? parseInt(detail.storage_id, 10) : null;

                            const availableStorages = baseModelId ? [...new Set(models.filter(m => m.model_name_id === baseModelId).map(m => m.storage_id))].map(sid => storageOptions.find(s => s.id === sid)).filter(Boolean) : [];
                            const availableColors = baseModelId && storageId ? models.filter(m => m.model_name_id === baseModelId && m.storage_id === storageId).map(m => colorOptions.find(c => c.id === m.color_id)).filter(Boolean) : [];
                            
                            return (
                                <div key={index} className="details-row">
                                    <div className="details-grid">
                                        <div className="form-section">
                                            <label>Тип товара</label>
                                            <select className="form-select" value={detail.type} onChange={(e) => handleDetailChange(index, 'type', e.target.value)}>
                                                <option value="model">Телефон</option>
                                                <option value="accessory">Аксессуар</option>
                                            </select>
                                        </div>
                                        
                                        {detail.type === 'model' ? (
                                            <>
                                                <div className="form-section">
                                                    <label>Базовая модель</label>
                                                    <Select
                                                        options={baseModelOptions}
                                                        value={baseModelOptions.find(opt => opt.value === parseInt(detail.model_base_id))}
                                                        onChange={(selectedOption) => handleDetailChange(index, 'model_base_id', selectedOption ? selectedOption.value : '')}
                                                        placeholder="Выберите или начните ввод..."
                                                        isClearable
                                                        isSearchable
                                                        required
                                                        filterOption={(option, inputValue) => 
                                                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                                                        }
                                                    />
                                                </div>
                                                <div className="form-section">
                                                    <label>Память</label>
                                                    <select className="form-select" value={detail.storage_id} onChange={(e) => handleDetailChange(index, 'storage_id', e.target.value)} required disabled={!detail.model_base_id}>
                                                        <option value="">Выберите...</option>
                                                        {availableStorages.map(s => <option key={s.id} value={s.id}>{s.storage}GB</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-section">
                                                    <label>Цвет</label>
                                                    <select className="form-select" value={detail.color_id} onChange={(e) => handleDetailChange(index, 'color_id', e.target.value)} required disabled={!detail.storage_id}>
                                                        <option value="">Выберите...</option>
                                                        {availableColors.map(c => <option key={c.id} value={c.id}>{c.color_name}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="form-section">
                                                <label>Аксессуар</label>
                                                <Select
                                                    options={accessoryOptions}
                                                    value={accessoryOptions.find(opt => opt.value === parseInt(detail.accessory_id))}
                                                    onChange={(selectedOption) => handleDetailChange(index, 'accessory_id', selectedOption ? selectedOption.value : '')}
                                                    placeholder="Выберите или начните ввод..."
                                                    isClearable
                                                    isSearchable
                                                    required
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="form-section">
                                            <label>Количество</label>
                                            <input className="form-input" type="number" value={detail.quantity} onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)} required />
                                        </div>
                                        <div className="form-section">
                                            <label>Цена за шт.</label>
                                            <input className="form-input" type="number" step="0.01" value={detail.price} onChange={(e) => handleDetailChange(index, 'price', e.target.value)} required />
                                        </div>
                                    </div>
                                    {newOrder.details.length > 1 && (
                                        <button type="button" onClick={() => removeDetailRow(index)} className="btn btn-danger btn-compact" style={{marginTop: '1rem'}}>Удалить</button>
                                    )}
                                </div>
                            );
                        })}
                        <button type="button" onClick={addDetailRow} className="btn btn-secondary">Добавить позицию</button>
                        <button type="submit" className="btn btn-primary">Создать заказ</button>
                    </form>
                </div>
            )}
            
            <div className="order-page-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Существующие Заказы</h2>
                    <button 
                        onClick={handleRefreshAllStatuses} 
                        className="btn btn-secondary" 
                        style={{ marginTop: 0 }}
                        disabled={isRefreshingAll}
                    >
                        {isRefreshingAll ? 'Обновление...' : '🔄 Обновить все статусы СДЭК'}
                    </button>
                </div>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID Заказа</th>
                            {hasPermission('view_purchase_prices') && <th>Поставщик</th>}
                            <th>Детали заказа</th>
                            {hasPermission('view_purchase_prices') && <th>Общая стоимость</th>}
                            <th>Статус заказа</th>
                            {hasPermission('view_purchase_prices') && <th>Статус оплаты</th>}
                            <th>Доставка СДЭК</th>
                            <th>Статус СДЭК</th> 
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            const totalCost = order.details.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

                            return (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    {hasPermission('view_purchase_prices') && <td>{suppliers.find(s => s.id === order.supplier_id)?.name || 'Неизвестно'}</td>}
                                    <td>
                                        <ul>
                                            {order.details.map(detail => (
                                                <li key={detail.id}>
                                                    {detail.model_name || detail.accessory_name}: {detail.quantity} шт.
                                                    {detail.price > 0 && ` по ${detail.price} руб.`}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    {hasPermission('view_purchase_prices') && <td>{totalCost.toFixed(2)} руб.</td>}
                                    <td>{order.status}</td>
                                    {hasPermission('view_purchase_prices') && <td>{order.payment_status}</td>}
                                    <td>
                                        {/* Логика для отображения статуса СДЭК */}
                                        {order.sdek_track_number ? (
                                            <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                {order.sdek_track_number}
                                            </div>
                                        ) : order.sdek_order_uuid ? (
                                            <div style={{color: '#6c757d'}}>Ожидается...</div>
                                        ) : (
                                            'Не создан'
                                        )}
                                    </td>
                                    <td><strong>{order.sdek_status || '...'}</strong></td>
                                    <td>
                                        <div className="action-buttons-container">
                                            {order.status !== 'Получен' && (hasPermission('manage_inventory') || hasPermission('receive_supplier_orders')) &&
                                                <button onClick={() => handleReceiveOrder(order.id)} className="btn btn-primary btn-compact">Получить</button>
                                            }
                                            {order.payment_status !== 'Оплачен' && hasPermission('manage_cashflow') &&
                                                <button onClick={() => handlePayOrder(order.id)} className="btn btn-secondary btn-compact">Оплатить</button>
                                            }
                                            {/* Кнопка "Создать в СДЭК" теперь проверяет UUID */}
                                            {hasPermission('manage_inventory') && !order.sdek_order_uuid && (
                                                <button onClick={() => handleOpenSdekModal(order)} className="btn btn-info btn-compact" style={{backgroundColor: '#0dcaf0'}}>
                                                    Создать в СДЭК
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isSdekModalOpen && (
                <div className="confirm-modal-overlay">
                    <form onSubmit={handleSdekSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '500px' }}>
                        <h3>Создать заказ в СДЭК для заказа №{currentOrderForSdek.id}</h3>
                        <h4>Отправитель (Поставщик)</h4>
                        <div className="form-section">
                            <label>Имя отправителя*</label>
                            <input 
                                type="text" 
                                name="sender_name" 
                                value={sdekFormData.sender_name} 
                                onChange={handleSdekFormChange} 
                                className="form-input" 
                                required 
                            />
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                {quickNames.map(name => (
                                    <button 
                                        key={name} 
                                        type="button" 
                                        onClick={() => setSdekFormData(prev => ({...prev, sender_name: name}))} 
                                        className="btn btn-secondary btn-compact" 
                                        style={{width: 'auto', marginTop: 0, fontSize: '0.8rem'}}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-section">
                            <label>Телефон отправителя*</label>
                            <IMaskInput
                                mask="+7 (000) 000-00-00"
                                value={sdekFormData.sender_phone}
                                onAccept={(value) => handleSdekFormChange({ target: { name: 'sender_phone', value } })}
                                className="form-input"
                                placeholder="+7 (___) ___-__-__"
                                required
                            />
                        </div>
                        <h4>Откуда</h4>
                         <div className="form-section">
                            <label>Адрес отправителя*</label>
                            <AsyncSelect
                                cacheOptions
                                loadOptions={loadAddressOptions}
                                defaultOptions
                                value={sdekFormData.from_location_address ? { label: sdekFormData.from_location_address, value: sdekFormData.from_location_address } : null}
                                onChange={(selectedOption) => {
                                    setSdekFormData(prev => ({ ...prev, from_location_address: selectedOption ? selectedOption.value : '' }));
                                }}
                                placeholder="Начните вводить город, улицу..."
                                loadingMessage={() => 'Поиск...'}
                                noOptionsMessage={() => 'Нет вариантов или введите больше символов'}
                                required
                            />
                        </div>
                        <h4>Габариты посылки</h4>
                        <div className="details-grid">
                            <div className="form-section">
                                <label>Вес (граммы)*</label>
                                <input type="number" name="weight" value={sdekFormData.weight} onChange={handleSdekFormChange} className="form-input" required />
                            </div>
                            <div className="form-section">
                                <label>Длина (см)*</label>
                                <input type="number" name="length" value={sdekFormData.length} onChange={handleSdekFormChange} className="form-input" required />
                            </div>
                            <div className="form-section">
                                <label>Ширина (см)*</label>
                                <input type="number" name="width" value={sdekFormData.width} onChange={handleSdekFormChange} className="form-input" required />
                            </div>
                            <div className="form-section">
                                <label>Высота (см)*</label>
                                <input type="number" name="height" value={sdekFormData.height} onChange={handleSdekFormChange} className="form-input" required />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button type="button" onClick={handleCalculateCost} className="btn btn-secondary" disabled={isCalculating} style={{ marginTop: 0 }}>
                                {isCalculating ? 'Расчет...' : 'Рассчитать стоимость'}
                            </button>
                            {calculatedCost !== null && (
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    Стоимость: {parseFloat(calculatedCost).toLocaleString('ru-RU')} руб.
                                </div>
                            )}
                        </div>
                        <div className="confirm-modal-buttons">
                            <button type="submit" className="btn btn-primary">Создать</button>
                            <button type="button" onClick={() => setIsSdekModalOpen(false)} className="btn btn-secondary">Отмена</button>
                        </div>
                    </form>
                </div>
            )}
            {isPaymentModalOpen && (
                    <div className="confirm-modal-overlay">
                        <div className="confirm-modal-dialog">
                            <h3>Оплатить заказ поставщику №{orderIdToPay}</h3>
                            <div className="form-section">
                                <label>Счет оплаты:</label>
                                <Select
                                    options={accountOptions}
                                    value={paymentAccount}
                                    onChange={setPaymentAccount}
                                    placeholder="Выберите счет..."
                                    isClearable
                                />
                            </div>
                            <div className="form-section">
                                <label>Сумма оплаты:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-section">
                                <label>Примечания:</label>
                                <textarea
                                    className="form-input"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    rows="3"
                                />
                            </div>
                            <div className="confirm-modal-buttons">
                                <button onClick={confirmAndPayOrder} className="btn btn-primary">Подтвердить оплату</button>
                                <button onClick={cancelPayOrder} className="btn btn-secondary">Отмена</button>
                            </div>
                        </div>
                    </div>
                )}

                {isConfirmModalOpen && (
                    <div className="confirm-modal-overlay">
                        <div className="confirm-modal-dialog">
                            <h3>Подтвердите действие</h3>
                            {phonesSentToSupplier.length > 0 && (
                            <div style={{marginTop: '1.5rem'}}>
                                <h4>Вернулось с этим заказом (брак/ремонт):</h4>
                                <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.5rem', padding: '1rem'}}>
                                    {phonesSentToSupplier.map(phone => (
                                        <div key={phone.id}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={returnedWithOrder.includes(phone.id)}
                                                    onChange={() => handleReturnedCheckboxChange(phone.id)}
                                                />
                                                {phone.model?.name} (S/N: {phone.serial_number})
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                            <p>Вы уверены, что хотите отметить этот заказ как полученный? Все товары из заказа будут оприходованы.</p>
                            <div className="confirm-modal-buttons">
                                <button onClick={confirmAndReceiveOrder} className="btn btn-primary">Да, получить</button>
                                <button onClick={cancelReceiveOrder} className="btn btn-secondary">Отмена</button>
                            </div>
                        </div>
                    </div>
            )}
        </div>
    );
}

export default OrdersPage;