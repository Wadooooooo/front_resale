// src/pages/SalesPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getProductsForSale, getCustomers, createSale, getAccounts, getCompatibleAccessories, getPhoneById, createCustomer, getTrafficSources } from '../api';
import { printReceipt } from '../utils/printReceipt';
import './OrdersPage.css';
import { useAuth } from '../context/AuthContext';

const creditOptions = {
    "Рассрочка на 3 месяца": 7,
    "Рассрочка на 6 месяцев": 9.5,
    "Рассрочка на 10 месяцев": 13,
    "Рассрочка на 12 месяцев": 14.5,
    "Рассрочка на 18 месяцев": 19,
    "Рассрочка на 24 месяца": 28.5,
    "По СБП": 5,
    "Картой": 5,
};

// Функция для расчета по вашей формуле
const calculatePrice = (basePrice, percent) => {
    if (!basePrice || !percent) return 0;
    
    // 1. Сначала вычисляем "сырую" цену по формуле, как и раньше
    const rawPrice = (basePrice * 100) / (100 - percent);
    
    // 2. Затем применяем логику округления вверх до ближайшей сотни
    const roundedPrice = Math.ceil(rawPrice / 100) * 100;
    
    return roundedPrice;
};

const paymentMethodOptions = [
    { value: 'НАЛИЧНЫЕ', label: 'Наличные' },
    { value: 'КАРТА', label: 'Карта' },
    { value: 'ПЕРЕВОД', label: 'Перевод' },
];

const NewCustomerModal = ({ isOpen, onClose, onCustomerCreated, existingCustomers }) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [referrerId, setReferrerId] = useState(null); // Для выбора "кто привел"
    const [trafficSources, setTrafficSources] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Загружаем источники трафика при открытии окна
            const fetchSources = async () => {
                try {
                    const sources = await getTrafficSources();
                    setTrafficSources(sources);
                } catch (err) {
                    console.error("Не удалось загрузить источники трафика", err);
                }
            };
            fetchSources();
            // Сбрасываем поля при каждом открытии
            setName(''); setNumber(''); setSourceId(''); setReferrerId(null); setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name) {
            setError('Имя обязательно для заполнения.');
            return;
        }
        try {
            const customerData = {
                name,
                number,
                source_id: sourceId ? parseInt(sourceId) : null,
                referrer_id: referrerId ? referrerId.value : null
            };
            const newCustomer = await createCustomer(customerData);
            onCustomerCreated(newCustomer);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при создании клиента.');
        }
    };

    if (!isOpen) return null;

    // Опции для выбора того, кто привел клиента
    const customerOptions = existingCustomers.map(c => ({ value: c.id, label: `${c.name} (${c.number || 'б/н'})` }));

    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '500px' }}>
                <h3>Новый покупатель</h3>
                <div className="details-grid">
                    <div className="form-section">
                        <label>Имя*</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-section">
                        <label>Номер телефона</label>
                        <input type="text" value={number} onChange={e => setNumber(e.target.value)} className="form-input" />
                    </div>
                </div>
                <div className="form-section">
                    <label>Откуда узнал?</label>
                    <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="form-select">
                        <option value="">-- Выберите источник --</option>
                        {trafficSources.map(source => (
                            <option key={source.id} value={source.id}>{source.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-section">
                    <label>Кто привел? (если по рекомендации)</label>
                    <Select options={customerOptions} value={referrerId} onChange={setReferrerId} isClearable placeholder="Выберите клиента..."/>
                </div>
                {error && <p className="form-message error">{error}</p>}
                <div className="confirm-modal-buttons">
                    <button type="submit" className="btn btn-primary">Сохранить</button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                </div>
            </form>
        </div>
    );
};


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
    const [cashReceived, setCashReceived] = useState('');
    const [changeGiven, setChangeGiven] = useState(0);
    const [customerDidNotTakeChange, setCustomerDidNotTakeChange] = useState(false);
    const [actualChangeGiven, setActualChangeGiven] = useState('');
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [priceAdjustment, setPriceAdjustment] = useState(0); // Сумма наценки
    const [originalPrice, setOriginalPrice] = useState(0);
    const [saleSuccessData, setSaleSuccessData] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);  
    const { hasPermission } = useAuth();
    const [phoneForCalculator, setPhoneForCalculator] = useState(null);

    useEffect(() => {
        const phoneInCart = cart.find(item => item.product_type === 'Телефон');
        if (!phoneInCart) {
            setPriceAdjustment(0);
            return;
        }

        // Сохраняем оригинальную цену при первом добавлении
        if (originalPrice === 0) {
            setOriginalPrice(phoneInCart.price);
        }

        if (paymentMethod.value === 'КАРТА' || paymentMethod.value === 'СБП') {
            const cardPrice = calculatePrice(originalPrice, creditOptions['Картой']);
            const adjustment = cardPrice - originalPrice;
            setPriceAdjustment(adjustment);
        } else {
            setPriceAdjustment(0); // Сбрасываем наценку для наличных
        }

    }, [paymentMethod, cart, originalPrice]);

    useEffect(() => {
        // Ищем первый телефон в корзине, чтобы использовать его цену для расчетов
        const firstPhoneInCart = cart.find(item => item.product_type === 'Телефон');
        setPhoneForCalculator(firstPhoneInCart || null);
    }, [cart]); // Этот хук будет срабатывать каждый раз, когда меняется корзина


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
        loadData();
    }, []);

    useEffect(() => {
        let defaultAccount = null;

        // Ищем нужный счет в зависимости от метода оплаты
        if (paymentMethod.value === 'НАЛИЧНЫЕ') {
            // Ищем счет "Наличные"
            defaultAccount = accounts.find(acc => acc.name.toLowerCase() === 'наличные');
        } else if (paymentMethod.value === 'КАРТА') {
            // Ищем счет "Расчетный счет"
            defaultAccount = accounts.find(acc => acc.name.toLowerCase() === 'расчетный счет');
        }

        // Если нашли подходящий счет по умолчанию, устанавливаем его
        if (defaultAccount) {
            setSelectedAccountId({ value: defaultAccount.id, label: defaultAccount.name });
        } else {
            // Для "Перевода" или если счет не найден, сбрасываем выбор,
            // чтобы пользователь выбрал его вручную.
            setSelectedAccountId(null);
        }
    }, [paymentMethod, accounts]);

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

    const handleCustomerCreated = (newCustomer) => {
        // 1. Закрываем модальное окно
        setIsCustomerModalOpen(false);

        setCustomers(prev => [...prev, newCustomer]);

        setSelectedCustomerId({ 
            value: newCustomer.id, 
            label: `${newCustomer.name || 'Имя не указано'} (${newCustomer.number || 'Номер не указан'})` 
        });
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
            discount: parseFloat(discount) || 0,
            cash_received: cashReceived ? parseFloat(cashReceived) : null,
            change_given: (changeGiven > 0 && !customerDidNotTakeChange) ? changeGiven : null,
            cash_received: cashReceived ? parseFloat(cashReceived) : null,
            // Определяем, какую сдачу реально выдали
            change_given: customerDidNotTakeChange 
                ? (actualChangeGiven ? parseFloat(actualChangeGiven) : 0)
                : (changeGiven > 0 ? changeGiven : null)
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
    const totalAmount = subtotal + priceAdjustment - (parseFloat(discount) || 0);
    const handleCashReceivedChange = (e) => {
        const received = e.target.value;
        setCashReceived(received);
        const receivedAmount = parseFloat(received) || 0;

        if (receivedAmount >= totalAmount) {
            const calculatedChange = receivedAmount - totalAmount;
            setChangeGiven(calculatedChange);
            // При изменении полученной суммы, сбрасываем ручной ввод сдачи
            setActualChangeGiven(calculatedChange.toFixed(2)); 
        } else {
            setChangeGiven(0);
            setActualChangeGiven('0.00');
        }
    };
    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <NewCustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onCustomerCreated={handleCustomerCreated}
                existingCustomers={customers}
            />
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
                            <th style={{ width: '100px' }}>Кол-во</th>
                            <th style={{ width: '120px' }}>Цена</th>
                            <th style={{ width: '120px' }}>Сумма</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.length === 0 ? (
                            // ИЗМЕНЕНИЕ 3: Динамический colspan для пустой корзины
                            <tr><td colSpan={hasPhoneInCart ? 6 : 5}>Корзина пуста</td></tr>
                        ) : (
                            cart.map(item => (
                                <tr key={item.warehouse_id}>
                                    <td>
                                        {item.name} {item.serial_number && `(S/N: ${item.serial_number})`}

                                        {/* Новая логика для чекбокса "В подарок" */}
                                        {item.product_type === 'Аксессуар' && hasPhoneInCart && (
                                            <span style={{ marginLeft: '10px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                                                <input
                                                    type="checkbox"
                                                    id={`gift-${item.warehouse_id}`}
                                                    checked={item.isGift}
                                                    onChange={() => handleToggleGift(item.warehouse_id)}
                                                    style={{ marginRight: '5px', cursor: 'pointer', verticalAlign: 'middle' }}
                                                />
                                                <label 
                                                    htmlFor={`gift-${item.warehouse_id}`} 
                                                    style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                                                >
                                                    В подарок
                                                </label>
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <input type="number" className="form-input form-input-compact" value={item.quantity} onChange={(e) => handleQuantityChange(item.warehouse_id, e.target.value)} disabled={item.product_type === "Телефон"} />
                                    </td>
                                    <td>{item.isGift ? '0.00' : parseFloat(item.price).toFixed(2)} руб.</td>
                                    <td>{item.isGift ? '0.00' : (parseFloat(item.price) * item.quantity).toFixed(2)} руб.</td>
                                    <td><button onClick={() => handleRemoveFromCart(item.warehouse_id)} className="btn btn-danger btn-compact">X</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {recommendedAccessories.length > 0 && (
    <div className="recommended-accessories">
            <h4>Рекомендуемые аксессуары:</h4>
            <div className="recommended-items-grid">
                {recommendedAccessories.map(acc => (
                    <div key={acc.id} className="recommended-item">
                        <span>{acc.name} ({acc.current_price} руб.)</span>
                        <button 
                            onClick={() => addRecommendedToCart(acc)} 
                            className="btn btn-secondary btn-compact"
                        >
                            Добавить
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )}   
    {phoneForCalculator && (
        <div className="order-page-container" style={{marginTop: '2rem'}}>
            <h2 
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)} 
                style={{ cursor: 'pointer', userSelect: 'none' }}
            >
                Калькулятор рассрочки {isCalculatorOpen ? '▼' : '▶'}
            </h2>
            
            {isCalculatorOpen && (
                <>
                    <p>
                        Расчет для: <strong>{phoneForCalculator.name}</strong>
                        <br />
                        Цена за наличный расчет: <strong>{parseFloat(phoneForCalculator.price).toLocaleString('ru-RU')} руб.</strong>
                    </p>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Способ оплаты</th>
                                <th>Итоговая стоимость</th>
                                <th>Ежемесячный платеж</th>
                                <th>Переплата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(creditOptions).map(([name, percent]) => {
                                const totalPrice = calculatePrice(phoneForCalculator.price, percent);
                                const monthsMatch = name.match(/(\d+)\s*месяц/);
                                const months = monthsMatch ? parseInt(monthsMatch[1], 10) : null;
                                const monthlyPayment = months ? (totalPrice / months) : null;
                                const overpayment = totalPrice - phoneForCalculator.price;

                                return (
                                    <tr key={name}>
                                        <td>{name}</td>
                                        <td><strong>{totalPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.</strong></td>
                                        <td>
                                            {monthlyPayment 
                                                ? `${monthlyPayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.`
                                                : '—'
                                            }
                                        </td>
                                        <td>{overpayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    )}
            </div>

            <div className="order-page-container">
                <h2>2. Укажите детали продажи</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Клиент</label><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Select 
                                options={customerOptions} 
                                value={selectedCustomerId} 
                                onChange={setSelectedCustomerId} 
                                placeholder="Розничный покупатель"
                                isClearable 
                                styles={{ container: (base) => ({ ...base, flexGrow: 1 }) }}
                            />
                            <button onClick={() => setIsCustomerModalOpen(true)} className="btn btn-secondary" style={{ margin: 0, padding: '10px 15px' }}>+</button>
                        </div>
                    </div>
                    <div className="form-section"><label>Метод оплаты</label><Select options={paymentMethodOptions} value={paymentMethod} onChange={setPaymentMethod} /></div>
                    {paymentMethod.value === 'ПЕРЕВОД' ? (
                        <div className="form-section">
                            <label>Счет зачисления</label>
                            <Select options={transferAccountOptions} value={selectedAccountId} onChange={setSelectedAccountId} placeholder="Выберите счет (карту)..." />
                        </div>
                    ) : (
                        <div className="form-section">
                            <label>Счет зачисления</label>
                            {/* ИЗМЕНЕНИЕ ЗДЕСЬ: Теперь input показывает label из автоматически выбранного счета */}
                            <input type="text" className="form-input" value={selectedAccountId ? selectedAccountId.label : 'Автоматически'} disabled />
                        </div>
                    )}
                    <div className="form-section"><label>Скидка (руб.)</label><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="form-input" placeholder="0" /></div>
                </div>
                <div className="form-section"><label>Примечание к продаже</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows="2"></textarea></div>
                <div className="sale-total">
                    <p>Сумма: <span>{subtotal.toFixed(2)} руб.</span></p>
                    {priceAdjustment > 0 && (
                        <p>Наценка за эквайринг: <span>+{priceAdjustment.toFixed(2)} руб.</span></p>
                    )}

                    <p>Скидка: <span>-{(parseFloat(discount) || 0).toFixed(2)} руб.</span></p>
                    <h3>Итого: <span>{totalAmount.toFixed(2)} руб.</span></h3>
                </div>
                {paymentMethod.value === 'НАЛИЧНЫЕ' && (
                    <div className="details-grid" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <div className="form-section">
                            <label>Получено от клиента (руб.)</label>
                            <input 
                                type="number" 
                                value={cashReceived} 
                                onChange={handleCashReceivedChange} 
                                className="form-input" 
                                placeholder={totalAmount.toFixed(2)}
                            />
                        </div>
                        <div className="form-section">
                            <label>Сдача (руб.)</label>
                            <input 
                                type="number"
                                step="0.01"
                                // Если чек-бокс нажат - используем ручной ввод, иначе - авто-расчет
                                value={customerDidNotTakeChange ? actualChangeGiven : changeGiven.toFixed(2)}
                                // Поле можно редактировать, только если нажат чек-бокс
                                readOnly={!customerDidNotTakeChange}
                                onChange={(e) => setActualChangeGiven(e.target.value)}
                                className="form-input"
                                style={{ fontWeight: 'bold' }}
                            />
                            {changeGiven > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={customerDidNotTakeChange}
                                            onChange={(e) => setCustomerDidNotTakeChange(e.target.checked)}
                                            style={{ marginRight: '8px', verticalAlign: 'middle' }}
                                        />
                                        <span style={{ verticalAlign: 'middle' }}>Клиент не забрал (всю) сдачу</span>
                                    </label>
                                    {customerDidNotTakeChange && (
                                        <small style={{ display: 'block', marginTop: '4px', color: '#6c757d' }}>
                                            Укажите в поле "Сдача" ту сумму, которую вы фактически выдали клиенту.
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            <button onClick={handleSubmitSale} className="btn btn-primary" style={{ float: 'right' }} disabled={cart.length === 0 || isSubmitting}>
                {isSubmitting ? 'Оформление...' : 'Оформить продажу'}
            </button>
            </div>

            {saleSuccessData && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Продажа №{saleSuccessData.id} успешно оформлена!</h3>
                        <p>Итоговая сумма: <strong>{saleSuccessData.total_amount.toFixed(2)} руб.</strong></p>
                        <div className="confirm-modal-buttons">
                            <button onClick={() => printReceipt(saleSuccessData)} className="btn btn-secondary">
                                Напечатать чек
                            </button>
                            <button onClick={resetSaleForm} className="btn btn-primary">
                                OK (Завершить)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesPage;