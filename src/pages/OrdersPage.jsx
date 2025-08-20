// RESALE-FRONTEND/src/pages/OrdersPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import {
    getSupplierOrders, createSupplierOrder, getSuppliers, receiveSupplierOrder,
    getAllModelsFullInfo, getUniqueModelNames, getAllAccessoriesInfo, getStorageOptions,
    getColorOptions, paySupplierOrder, getAccounts
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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [orderIdToPay, setOrderIdToPay] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAccount, setPaymentAccount] = useState(null);
    const [paymentNotes, setPaymentNotes] = useState('');
    
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
    const handleReceiveOrder = (orderId) => {
        setOrderIdToConfirm(orderId);
        setIsConfirmModalOpen(true);
    }; //
    
        const confirmAndReceiveOrder = async () => {
        if (!orderIdToConfirm) return;
        try {
            const updatedOrder = await receiveSupplierOrder(orderIdToConfirm);
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
                <h2>Существующие Заказы</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID Заказа</th>
                            {hasPermission('view_purchase_prices') && <th>Поставщик</th>}
                            <th>Детали заказа</th>
                            {/* 1. ДОБАВЛЯЕМ НОВЫЙ ЗАГОЛОВОК */}
                            {hasPermission('view_purchase_prices') && <th>Общая стоимость</th>}
                            <th>Статус заказа</th>
                            {hasPermission('view_purchase_prices') && <th>Статус оплаты</th>}
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            // 2. ВЫЧИСЛЯЕМ ОБЩУЮ СТОИМОСТЬ ЗАКАЗА
                            const totalCost = order.details.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

                            return (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    {hasPermission('view_purchase_prices') && 
                                        <td>{suppliers.find(s => s.id === order.supplier_id)?.name || 'Неизвестно'}</td>
                                    }
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
                                    {/* 3. ДОБАВЛЯЕМ НОВУЮ ЯЧЕЙКУ С ИТОГОВОЙ ЦЕНОЙ */}
                                    {hasPermission('view_purchase_prices') && 
                                        <td>{totalCost.toFixed(2)} руб.</td>
                                    }
                                    <td>{order.status}</td>
                                    {hasPermission('view_purchase_prices') && <td>{order.payment_status}</td>}
                                    <td>
                                        <div className="action-buttons-container">
                                            {order.status !== 'Получен' && (hasPermission('manage_inventory') || hasPermission('receive_supplier_orders')) &&
                                                <button onClick={() => handleReceiveOrder(order.id)} className="btn btn-primary btn-compact">Получить</button>
                                            }
                                            {order.payment_status !== 'Оплачен' && hasPermission('manage_cashflow') &&
                                                <button onClick={() => handlePayOrder(order.id)} className="btn btn-secondary btn-compact">Оплатить</button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
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