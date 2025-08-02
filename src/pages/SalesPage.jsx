// src/pages/SalesPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getProductsForSale, getCustomers, createSale, getAccounts, getCompatibleAccessories, getPhoneById } from '../api';
import { printReceipt } from '../utils/printReceipt';
import './OrdersPage.css';
import { useAuth } from '../context/AuthContext';

const paymentMethodOptions = [
    { value: 'НАЛИЧНЫЕ', label: 'Наличные' },
    { value: 'КАРТА', label: 'Карта' },
    { value: 'ПЕРЕВОД', label: 'Перевод' },
];

function SalesPage() {
    // Состояния (без изменений)
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(paymentMethodOptions[0]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [recommendedAccessories, setRecommendedAccessories] = useState([]);
    const [discount, setDiscount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saleSuccessData, setSaleSuccessData] = useState(null);
    const { hasPermission } = useAuth();

    // Загрузка данных (без изменений)
    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, customersData, accountsData] = await Promise.all([
                getProductsForSale(),
                getCustomers(),
                getAccounts()
            ]);
            setProducts(productsData);
            setCustomers(customersData);
            setAccounts(accountsData);
        } catch (err) {
            setError('Не удалось загрузить данные для продажи.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Теперь мы всегда загружаем счета вместе с остальными данными
                const [
                    productsData, 
                    customersData, 
                    accountsData
                ] = await Promise.all([
                    getProductsForSale(),
                    getCustomers(),
                    getAccounts()
                ]);
                
                setProducts(productsData);
                setCustomers(customersData);
                setAccounts(accountsData);

            } catch (err) {
                setError('Не удалось загрузить данные для продажи.');
            } finally {
                setLoading(false);
            }
        };

        if (hasPermission) { // Запускаем, только когда функция hasPermission готова
            loadData();
        }
    }, [hasPermission]);

    // Опции для выпадающих списков
    const productOptions = products
      .filter(p => !cart.some(cartItem => cartItem.warehouse_id === p.warehouse_id))
      .map(p => ({
        value: p.warehouse_id,
        label: `${p.name} (Цена: ${p.price} руб.) ${p.serial_number ? `S/N: ${p.serial_number}` : ` | Остаток: ${p.quantity}`}`,
        product: p
    }));
    const customerOptions = customers.map(c => ({ value: c.id, label: `${c.name || 'Имя не указано'} (${c.number || 'Номер не указан'})` }));

    // Опции счетов для перевода
    const transferAccountOptions = accounts
        .filter(acc => acc.name.toLowerCase().includes('карта'))
        .map(acc => ({ value: acc.id, label: acc.name }));

    const hasPhoneInCart = cart.some(item => item.product_type === 'Телефон');

    // Все остальные обработчики остаются без изменений
    const handleDiscountChange = (e) => setDiscount(e.target.value);
    const handleAddToCart = async (selectedOption) => {
        if (!selectedOption) return;
        const productToAdd = selectedOption.product;
        if (productToAdd.product_type === 'Телефон' && productToAdd.product_id) {
            try {
                const phoneDetails = await getPhoneById(productToAdd.product_id);
                if (phoneDetails && phoneDetails.model.model_name_id) {
                    const compatible = await getCompatibleAccessories(phoneDetails.model.model_name_id);
                    const cartAccessoryIds = cart.map(item => item.product_id);
                    const filteredCompatible = compatible.filter(acc => !cartAccessoryIds.includes(acc.id));
                    setRecommendedAccessories(filteredCompatible);
                }
            } catch (err) { console.error("Не удалось загрузить совместимые аксессуары:", err); }
        }
        const existingCartItem = cart.find(item => item.warehouse_id === productToAdd.warehouse_id);
        if (existingCartItem) {
            if (existingCartItem.quantity < existingCartItem.maxQuantity) {
                setCart(cart.map(item => item.warehouse_id === productToAdd.warehouse_id ? { ...item, quantity: item.quantity + 1 } : item));
            }
        } else {
            setCart([...cart, { ...productToAdd, quantity: 1, maxQuantity: productToAdd.quantity, isGift: false }]);
        }
    };
    const addRecommendedToCart = (accessory) => {
        const productOnWarehouse = products.find(p => p.product_id === accessory.id && p.product_type === 'Аксессуар');
        if (productOnWarehouse) {
             handleAddToCart({ value: productOnWarehouse.warehouse_id, product: productOnWarehouse });
             setRecommendedAccessories(prev => prev.filter(rec => rec.id !== accessory.id));
        } else {
            alert(`Аксессуар "${accessory.name}" закончился на складе.`);
        }
    };
    const handleQuantityChange = (warehouse_id, newQuantity) => {
        const item = cart.find(i => i.warehouse_id === warehouse_id);
        const quantity = parseInt(newQuantity, 10);
        if (!isNaN(quantity) && quantity > 0 && quantity <= item.maxQuantity) {
            setCart(cart.map(i => i.warehouse_id === warehouse_id ? { ...i, quantity } : i));
        }
    };
    const handleRemoveFromCart = (warehouse_id) => {
        const removedItem = cart.find(item => item.warehouse_id === warehouse_id);
        setCart(cart.filter(item => item.warehouse_id !== warehouse_id));
        if (removedItem.product_type === 'Телефон') {
            setRecommendedAccessories([]);
        }
    };
    const handleToggleGift = (warehouse_id) => {
        setCart(cart.map(item => item.warehouse_id === warehouse_id ? { ...item, isGift: !item.isGift } : item));
    };
    const resetSaleForm = () => {
        setCart([]);
        setSelectedCustomerId(null);
        setNotes('');
        setDiscount('');
        setRecommendedAccessories([]);
        setSaleSuccessData(null);
        loadData();
    };
    const handleSubmitSale = async () => {
        if (!selectedAccountId) {
            setError('Пожалуйста, выберите счет для зачисления оплаты.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        const saleData = {
            customer_id: selectedCustomerId ? selectedCustomerId.value : null,
            payment_method: paymentMethod.value,
            notes,
            details: cart.map(item => ({
                warehouse_id: item.warehouse_id,
                quantity: item.quantity,
                unit_price: item.isGift ? 0 : item.price
            })),
            account_id: selectedAccountId.value,
            discount: parseFloat(discount) || 0
        };
        try {
            const saleResponse = await createSale(saleData);
            const newSale = {
                ...saleResponse,
                total_amount: parseFloat(saleResponse.total_amount),
                discount: parseFloat(saleData.discount) || 0,
                details: saleResponse.details.map(detail => ({ ...detail, unit_price: parseFloat(detail.unit_price) }))
            };
            setSaleSuccessData(newSale);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при оформлении продажи.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const subtotal = cart.reduce((total, item) => total + ((item.isGift ? 0 : parseFloat(item.price)) * item.quantity), 0);
    const totalAmount = subtotal - (parseFloat(discount) || 0);

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Продажа</h1>
            <div className="order-page-container">
                <h2>1. Добавьте товары в чек</h2>
                <div className="form-section">
                    <Select options={productOptions} onChange={handleAddToCart} placeholder="Начните вводить название, S/N или модель..." value={null} />
                </div>
                <h3>Корзина ({cart.length})</h3>
                {/* ЭТОТ БЛОК ОТСУТСТВОВАЛ У ВАС */}
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Товар</th>
                            <th style={{width: '100px'}}>Кол-во</th>
                            <th style={{width: '120px'}}>Цена</th>
                            <th style={{width: '120px'}}>Сумма</th>
                            {hasPhoneInCart && <th style={{width: '100px'}}>Подарок</th>}
                            <th style={{width: '50px'}}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.length === 0 ? (
                            // ИЗМЕНЕНИЕ 3: Динамический colspan для пустой корзины
                            <tr><td colSpan={hasPhoneInCart ? 6 : 5}>Корзина пуста</td></tr>
                        ) : (
                            cart.map(item => (
                                <tr key={item.warehouse_id}>
                                    <td>{item.name} {item.serial_number && `(S/N: ${item.serial_number})`}</td>
                                    <td>
                                        <input type="number" className="form-input form-input-compact" value={item.quantity} onChange={(e) => handleQuantityChange(item.warehouse_id, e.target.value)} disabled={item.product_type === "Телефон"} />
                                    </td>
                                    <td>{item.isGift ? '0.00' : parseFloat(item.price).toFixed(2)} руб.</td>
                                    <td>{item.isGift ? '0.00' : (parseFloat(item.price) * item.quantity).toFixed(2)} руб.</td>
                                    {/* ИЗМЕНЕНИЕ 4: Ячейка с чекбоксом отображается только при наличии телефона */}
                                    {hasPhoneInCart && <td><input type="checkbox" checked={item.isGift} onChange={() => handleToggleGift(item.warehouse_id)} /></td>}
                                    <td><button onClick={() => handleRemoveFromCart(item.warehouse_id)} className="btn btn-danger btn-compact">X</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {recommendedAccessories.length > 0 && ( <div className="recommended-accessories">{/*...*/}</div> )}
            </div>
            
            <div className="order-page-container">
                <h2>2. Укажите детали продажи</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Клиент</label><Select options={customerOptions} value={selectedCustomerId} onChange={setSelectedCustomerId} placeholder="Розничный покупатель" isClearable /></div>
                    <div className="form-section"><label>Метод оплаты</label><Select options={paymentMethodOptions} value={paymentMethod} onChange={setPaymentMethod} /></div>
                    {paymentMethod.value === 'ПЕРЕВОД' ? (
                        <div className="form-section"><label>Счет зачисления</label><Select options={transferAccountOptions} value={selectedAccountId} onChange={setSelectedAccountId} placeholder="Выберите счет (карту)..." /></div>
                    ) : (
                        <div className="form-section"><label>Счет зачисления</label><input type="text" className="form-input" value={selectedAccountId ? selectedAccountId.label : 'Автоматически'} disabled /></div>
                    )}
                    <div className="form-section"><label>Скидка (руб.)</label><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="form-input" placeholder="0" /></div>
                </div>
                <div className="form-section"><label>Примечание к продаже</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows="2"></textarea></div>
                <div className="sale-total">
                    <p>Сумма: <span>{subtotal.toFixed(2)} руб.</span></p>
                    <p>Скидка: <span>-{(parseFloat(discount) || 0).toFixed(2)} руб.</span></p>
                    <h3>Итого: <span>{totalAmount.toFixed(2)} руб.</span></h3>
                </div>
                <button onClick={handleSubmitSale} className="btn btn-primary" style={{float: 'right'}} disabled={cart.length === 0 || isSubmitting}>
                    {isSubmitting ? 'Оформление...' : 'Оформить продажу'}
                </button>
            </div>

            {saleSuccessData && ( <div className="confirm-modal-overlay">{/*...модальное окно...*/}</div> )}
        </div>
    );
}

export default SalesPage;