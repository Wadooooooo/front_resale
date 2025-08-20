// src/pages/SalesPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import { getProductsForSale, getCustomers, createSale, getAccounts, getCompatibleAccessories, getPhoneById, createCustomer, getTrafficSources } from '../api';
import { formatCheckNumber } from '../utils/formatters';
import { printWarrantyCard } from '../utils/printWarrantyCard';
import { printReceipt } from '../utils/printReceipt';
import './StockPage.css'; // Используем стили от каталога для карточек, если понадобятся
import './OrdersPage.css'; // Основные стили форм

const creditOptions = {
    "Рассрочка на 3 месяца": 7, "Рассрочка на 6 месяцев": 9.5, "Рассрочка на 10 месяцев": 13,
    "Рассрочка на 12 месяцев": 14.5, "Рассрочка на 18 месяцев": 19, "Рассрочка на 24 месяца": 28.5,
    "По СБП": 5, "Картой": 5,
};

const calculatePrice = (basePrice, percent) => {
    if (!basePrice || !percent) return 0;
    const rawPrice = (basePrice * 100) / (100 - percent);
    return Math.ceil(rawPrice / 100) * 100;
};

const paymentMethodOptions = [
    { value: 'НАЛИЧНЫЕ', label: 'Наличные' }, { value: 'КАРТА', label: 'Карта' }, { value: 'ПЕРЕВОД', label: 'Перевод' },
];

const NewCustomerModal = ({ isOpen, onClose, onCustomerCreated, existingCustomers }) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [referrerId, setReferrerId] = useState(null);
    const [trafficSources, setTrafficSources] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchSources = async () => {
                try {
                    const sources = await getTrafficSources();
                    setTrafficSources(sources);
                } catch (err) { console.error("Не удалось загрузить источники трафика", err); }
            };
            fetchSources();
            setName(''); setNumber(''); setSourceId(''); setReferrerId(null); setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name) { setError('Имя обязательно для заполнения.'); return; }
        try {
            const customerData = { name, number, source_id: sourceId ? parseInt(sourceId) : null, referrer_id: referrerId ? referrerId.value : null };
            const newCustomer = await createCustomer(customerData);
            onCustomerCreated(newCustomer);
        } catch (err) { setError(err.response?.data?.detail || 'Ошибка при создании клиента.'); }
    };

    if (!isOpen) return null;
    const customerOptions = existingCustomers.map(c => ({ value: c.id, label: c.number ? `${c.name} ${c.number}`: `${c.name} (б/н)` }));

    return (
        <div className="confirm-modal-overlay">
            <form onSubmit={handleSubmit} className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '500px' }}>
                <h3>Новый покупатель</h3>
                <div className="details-grid">
                    <div className="form-section"><label>Имя*</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required /></div>
                    <div className="form-section">
                        <label>Номер телефона</label>
                        <IMaskInput
                            mask="+7 (000) 000-00-00"
                            value={number}
                            onAccept={(value) => setNumber(value)}
                            className="form-input"
                            placeholder="+7 (___) ___-__-__"
                        />
                    </div>
                </div>
                <div className="form-section"><label>Откуда узнал?</label><select value={sourceId} onChange={e => setSourceId(e.target.value)} className="form-select"><option value="">-- Выберите источник --</option>{trafficSources.map(source => (<option key={source.id} value={source.id}>{source.name}</option>))}</select></div>
                <div className="form-section"><label>Кто привел?</label><Select options={customerOptions} value={referrerId} onChange={setReferrerId} isClearable placeholder="Выберите клиента..."/></div>
                {error && <p className="form-message error">{error}</p>}
                <div className="confirm-modal-buttons"><button type="submit" className="btn btn-primary">Сохранить</button><button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button></div>
            </form>
        </div>
    );
};

function SalesPage() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState('');
    const [cashReceived, setCashReceived] = useState('');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerDidNotTakeChange, setCustomerDidNotTakeChange] = useState(false);
    const [actualChangeGiven, setActualChangeGiven] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState("");  
    const [saleSuccessData, setSaleSuccessData] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);  
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [phoneForCalculator, setPhoneForCalculator] = useState(null);
    const [recommendedAccessories, setRecommendedAccessories] = useState([]);
    const [isConfirmPrintModalOpen, setIsConfirmPrintModalOpen] = useState(false);

    const cashPaymentAmount = useMemo(() => {
        const cashPayment = payments.find(p => p.payment_method?.value === 'НАЛИЧНЫЕ');
        return cashPayment ? parseFloat(cashPayment.amount || 0) : 0;
    }, [payments]);

    const isCashInsufficient = useMemo(() => {
        if (cashPaymentAmount > 0 && cashReceived) {
            return parseFloat(cashReceived) < cashPaymentAmount;
        }
        return false;
    }, [cashReceived, cashPaymentAmount]);

    const handleDiscountChange = (value) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) { setDiscount(''); } else if (numValue > 1000) { setDiscount('1000'); } else { setDiscount(String(numValue)); }
    };
    const handleTelegramDiscount = () => { if (subtotal > 0) { const calculatedDiscount = Math.round(subtotal * 0.02); setDiscount(String(calculatedDiscount)); } };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [productsData, customersData, accountsData] = await Promise.all([ getProductsForSale(), getCustomers(), getAccounts() ]);
            setProducts(productsData); setCustomers(customersData); setAccounts(accountsData);
            const cashAccount = accountsData.find(a => a.name.toLowerCase() === 'наличные');
            if (cashAccount) { setPayments([{ payment_method: paymentMethodOptions[0], account_id: { value: cashAccount.id, label: cashAccount.name }, amount: '' }]);
            } else { setPayments([{ payment_method: paymentMethodOptions[0], account_id: null, amount: '' }]); }
        } catch (err) { setError('Не удалось загрузить данные для продажи.'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + ((item.isGift ? 0 : parseFloat(item.price) || 0) * item.quantity), 0), [cart]);
    const baseTotal = useMemo(() => subtotal - (parseFloat(discount) || 0), [subtotal, discount]);
    const otherPaymentsAmount = useMemo(() => payments.reduce((sum, p) => p.payment_method?.value !== 'КАРТА' ? sum + (parseFloat(p.amount) || 0) : sum, 0), [payments]);
    const baseAmountForCard = useMemo(() => baseTotal - otherPaymentsAmount, [baseTotal, otherPaymentsAmount]);
    const finalCardAmount = useMemo(() => baseAmountForCard <= 0 ? 0 : calculatePrice(baseAmountForCard, creditOptions['Картой']), [baseAmountForCard]);
    const paymentAdjustment = useMemo(() => { if (!payments.some(p => p.payment_method?.value === 'КАРТА')) return 0; return finalCardAmount > 0 ? finalCardAmount - baseAmountForCard : 0; }, [finalCardAmount, baseAmountForCard, payments]);
    const totalAmount = useMemo(() => baseTotal + paymentAdjustment, [baseTotal, paymentAdjustment]);
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0), [payments]);
    const remainingBalance = useMemo(() => totalAmount - totalPaid, [totalAmount, totalPaid]);
    const changeGiven = useMemo(() => { const cashPayment = payments.find(p => p.payment_method?.value === 'НАЛИЧНЫЕ'); if (cashPayment && cashReceived && parseFloat(cashReceived) > 0) { const change = parseFloat(cashReceived) - parseFloat(cashPayment.amount || 0); return change > 0 ? change : 0; } return 0; }, [payments, cashReceived]);

    useEffect(() => { if (payments.length === 1) { const currentAmount = parseFloat(payments[0].amount || 0); if (Math.abs(currentAmount - totalAmount) > 0.01) { const newPayments = [...payments]; newPayments[0].amount = totalAmount > 0 ? totalAmount.toFixed(2) : ''; setPayments(newPayments); } } }, [totalAmount, payments]);
    useEffect(() => { if (!customerDidNotTakeChange) { setActualChangeGiven(changeGiven > 0 ? changeGiven.toFixed(2) : '0.00'); } }, [changeGiven, customerDidNotTakeChange]);
    useEffect(() => { setPhoneForCalculator(cart.find(item => item.product_type === 'Телефон') || null); }, [cart]);

    const handleAddPayment = () => { const usedMethods = payments.map(p => p.payment_method.value); const firstAvailableMethod = paymentMethodOptions.find(option => !usedMethods.includes(option.value)); if (!firstAvailableMethod) { alert("Все доступные методы оплаты уже добавлены."); return; } let defaultAccount = null; if (firstAvailableMethod.value === 'НАЛИЧНЫЕ') { const cashAccount = accounts.find(a => a.name.toLowerCase() === 'наличные'); if (cashAccount) defaultAccount = { value: cashAccount.id, label: cashAccount.name }; } else if (firstAvailableMethod.value === 'КАРТА') { const cardAccount = accounts.find(a => a.name.toLowerCase() === 'расчетный счет'); if (cardAccount) defaultAccount = { value: cardAccount.id, label: cardAccount.name }; } setPayments([...payments, { payment_method: firstAvailableMethod, account_id: defaultAccount, amount: '' }]); };
    const handleRemovePayment = (index) => setPayments(payments.filter((_, i) => i !== index));
    const handlePaymentChange = (index, field, value) => { const newPayments = [...payments]; const updatedPayment = { ...newPayments[index], [field]: value }; if (field === 'payment_method') { const cashAccount = accounts.find(a => a.name.toLowerCase() === 'наличные'); const cardAccount = accounts.find(a => a.name.toLowerCase() === 'расчетный счет'); const methodValue = value ? value.value : null; updatedPayment.account_id = null; updatedPayment.amount = ''; if (methodValue === 'НАЛИЧНЫЕ' && cashAccount) { updatedPayment.account_id = { value: cashAccount.id, label: cashAccount.name }; } else if (methodValue === 'КАРТА' && cardAccount) { updatedPayment.account_id = { value: cardAccount.id, label: cardAccount.name }; } } newPayments[index] = updatedPayment; setPayments(newPayments); };
    const handleAddToCart = useCallback(async (selectedOption) => { if (!selectedOption) return; const productToAdd = selectedOption.product; setPhoneForCalculator(productToAdd); if (productToAdd.product_type === 'Телефон' && productToAdd.product_id) { try { const phoneDetails = await getPhoneById(productToAdd.product_id); if (phoneDetails && phoneDetails.model.model_name_id) { const compatible = await getCompatibleAccessories(phoneDetails.model.model_name_id); const cartAccessoryIds = cart.map(item => item.product_id); setRecommendedAccessories(compatible.filter(acc => !cartAccessoryIds.includes(acc.id))); } } catch (err) { console.error("Не удалось загрузить совместимые аксессуары:", err); } } const existingCartItem = cart.find(item => item.warehouse_id === productToAdd.warehouse_id); if (existingCartItem) { if (existingCartItem.quantity < existingCartItem.maxQuantity) { setCart(cart.map(item => item.warehouse_id === productToAdd.warehouse_id ? { ...item, quantity: item.quantity + 1 } : item)); } } else { setCart([...cart, { ...productToAdd, quantity: 1, maxQuantity: productToAdd.quantity, isGift: false }]); } }, [cart, setPhoneForCalculator, setRecommendedAccessories, setCart]);
    const addRecommendedToCart = useCallback((accessory) => { const productOnWarehouse = products.find(p => p.product_id === accessory.id && p.product_type === 'Аксессуар'); if (productOnWarehouse) { handleAddToCart({ value: productOnWarehouse.warehouse_id, product: productOnWarehouse }); setRecommendedAccessories(prev => prev.filter(rec => rec.id !== accessory.id)); } else { alert(`Аксессуар "${accessory.name}" закончился на складе.`); } }, [products, handleAddToCart]);
    const handleQuantityChange = (warehouse_id, newQuantity) => { const item = cart.find(i => i.warehouse_id === warehouse_id); const quantity = parseInt(newQuantity, 10); if (!isNaN(quantity) && quantity > 0 && quantity <= item.maxQuantity) { setCart(cart.map(i => i.warehouse_id === warehouse_id ? { ...i, quantity } : i)); } };
    const handleRemoveFromCart = (warehouse_id) => { const removedItem = cart.find(item => item.warehouse_id === warehouse_id); setCart(cart.filter(item => item.warehouse_id !== warehouse_id)); if (removedItem.product_type === 'Телефон') { setRecommendedAccessories([]); } };
    const handleToggleGift = (warehouse_id) => { setCart(cart.map(item => item.warehouse_id === warehouse_id ? { ...item, isGift: !item.isGift } : item)); };
    const resetSaleForm = useCallback(() => { setCart([]); setSelectedCustomerId(null); setNotes(''); setDiscount(''); setCashReceived(''); setRecommendedAccessories([]); setSaleSuccessData(null); setError(''); setCustomerDidNotTakeChange(false); setActualChangeGiven(''); setDeliveryMethod(''); loadData(); }, [loadData]);
    const handleResetAndConfirm = () => { setIsConfirmPrintModalOpen(true); };
    const handleCustomerCreated = (newCustomer) => { setIsCustomerModalOpen(false); const updatedCustomers = [...customers, newCustomer]; setCustomers(updatedCustomers); setSelectedCustomerId({ value: newCustomer.id, label: `${newCustomer.name || 'Имя не указано'} (${newCustomer.number || 'Номер не указан'})` }); };
    const handleSubmitSale = async () => { if (cart.length === 0) { setError('Корзина пуста.'); return; } if (!deliveryMethod && Math.abs(remainingBalance) > 0.01) { setError(`Сумма платежей (${totalPaid.toFixed(2)}) не совпадает с итоговой суммой чека (${totalAmount.toFixed(2)}).`); return; } setError(''); setIsSubmitting(true); const actualChange = customerDidNotTakeChange ? (actualChangeGiven ? parseFloat(actualChangeGiven) : 0) : (changeGiven > 0 ? changeGiven : 0); const keptAmount = changeGiven > 0 ? Math.max(0, changeGiven - actualChange) : 0; const saleData = { customer_id: selectedCustomerId ? selectedCustomerId.value : null, notes, delivery_method: deliveryMethod || null, details: cart.map(item => ({ warehouse_id: item.warehouse_id, quantity: item.quantity, unit_price: item.isGift ? 0 : item.price })), payments: deliveryMethod ? [] : payments.map(p => ({ account_id: p.account_id.value, amount: parseFloat(p.amount), payment_method: p.payment_method.value })), discount: parseFloat(discount) || 0, cash_received: cashReceived ? parseFloat(cashReceived) : null, change_given: actualChange > 0 ? actualChange : null, kept_change: keptAmount > 0 ? keptAmount : null, payment_adjustment: paymentAdjustment > 0 ? paymentAdjustment : null, }; try { const saleResponse = await createSale(saleData); setSaleSuccessData(saleResponse); } catch (err) { setError(err.response?.data?.detail || 'Ошибка при оформлении продажи.'); } finally { setIsSubmitting(false); } };
    
    const hasPhoneInCart = cart.some(item => item.product_type === 'Телефон');
    const productOptions = products.filter(p => !cart.some(cartItem => cartItem.warehouse_id === p.warehouse_id)).map(p => ({ value: p.warehouse_id, label: `${p.name} (Цена: ${p.price || 0} руб.) ${p.serial_number ? `S/N: ${p.serial_number}` : `| Остаток: ${p.quantity}`}`, product: p }));
    const customerOptions = customers.map(c => ({ value: c.id, label: c.number ? `${c.name || 'Имя не указано'} ${c.number}` : `${c.name || 'Имя не указано'} (б/н)` }));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <NewCustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onCustomerCreated={handleCustomerCreated} existingCustomers={customers} />
            <h1>Продажа</h1>
            {error && <p className="form-message error">{error}</p>}
            
            <div className="order-page-container">
                <h2>1. Добавьте товары в чек</h2>
                <div className="form-section"><Select options={productOptions} onChange={handleAddToCart} placeholder="Начните вводить название, S/N или модель..." value={null} /></div>
                <h3>Корзина ({cart.length})</h3>
                <table className="orders-table">
                    <thead><tr><th>Товар</th><th style={{ width: '120px' }}></th><th style={{ width: '100px' }}>Кол-во</th><th style={{ width: '120px' }}>Цена</th><th style={{ width: '120px' }}>Сумма</th><th style={{ width: '50px' }}></th></tr></thead>
                    <tbody>
                        {cart.length === 0 ? (<tr><td colSpan="6">Корзина пуста</td></tr>) : (cart.map(item => (
                            <tr key={item.warehouse_id}>
                                <td>{item.name} {item.serial_number && `(S/N: ${item.serial_number})`}</td>
                                <td className="gift-checkbox-cell">{item.product_type === 'Аксессуар' && hasPhoneInCart && (<label className="gift-label"><input type="checkbox" checked={item.isGift} onChange={() => handleToggleGift(item.warehouse_id)} />В подарок</label>)}</td>
                                <td><input type="number" className="form-input form-input-compact" value={item.quantity} onChange={(e) => handleQuantityChange(item.warehouse_id, e.target.value)} disabled={item.product_type === "Телефон"} /></td>
                                <td>{item.isGift ? '0.00' : parseFloat(item.price || 0).toFixed(2)} руб.</td>
                                <td>{item.isGift ? '0.00' : (parseFloat(item.price || 0) * item.quantity).toFixed(2)} руб.</td>
                                <td><button onClick={() => handleRemoveFromCart(item.warehouse_id)} className="btn btn-danger btn-compact">X</button></td>
                            </tr>
                        )))}
                    </tbody>
                </table>
                {recommendedAccessories.length > 0 && (<div style={{marginTop: '1.5rem'}}><h4>Рекомендуемые аксессуары:</h4><div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>{recommendedAccessories.map(acc => (<div key={acc.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '5px', background: '#f8f9fa', borderRadius: '5px'}}><span>{acc.name} ({acc.current_price} руб.)</span><button onClick={() => addRecommendedToCart(acc)} className="btn btn-secondary btn-compact">Добавить</button></div>))}</div></div>)}   
                {phoneForCalculator && (<div className="order-page-container" style={{marginTop: '2rem'}}><h2 onClick={() => setIsCalculatorOpen(!isCalculatorOpen)} style={{ cursor: 'pointer', userSelect: 'none' }}>Калькулятор рассрочки {isCalculatorOpen ? '▼' : '▶'}</h2>{isCalculatorOpen && (<> <p>Расчет для: <strong>{phoneForCalculator.name}</strong>, цена: <strong>{parseFloat(phoneForCalculator.price).toLocaleString('ru-RU')} руб.</strong></p> <table className="orders-table"><thead><tr><th>Способ оплаты</th><th>Итоговая стоимость</th><th>Ежемесячный платеж</th><th>Переплата</th></tr></thead><tbody>{Object.entries(creditOptions).map(([name, percent]) => { const totalPrice = calculatePrice(phoneForCalculator.price, percent); const monthsMatch = name.match(/(\d+)\s*месяц/); const months = monthsMatch ? parseInt(monthsMatch[1], 10) : null; return ( <tr key={name}><td>{name}</td><td><strong>{totalPrice.toLocaleString('ru-RU')} руб.</strong></td><td>{months ? `${(totalPrice / months).toLocaleString('ru-RU')} руб.` : '—'}</td><td>{(totalPrice - phoneForCalculator.price).toLocaleString('ru-RU')} руб.</td></tr> ); })}</tbody></table> </>)}</div>)}
            </div>

            <div className="order-page-container">
                <h2>2. Укажите детали продажи</h2>
                <div className="details-grid">
                    <div className="form-section"><label>Клиент</label><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Select options={customerOptions} value={selectedCustomerId} onChange={setSelectedCustomerId} placeholder="Розничный покупатель" isClearable styles={{ container: (base) => ({ ...base, flexGrow: 1 }) }} /><button onClick={() => setIsCustomerModalOpen(true)} className="btn btn-secondary" style={{ margin: 0, padding: '10px 15px' }}>+</button></div></div>
                    <div className="form-section"><label>Примечание к продаже</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows="2"></textarea></div>
                    <div className="form-section" style={{ maxWidth: '400px' }}><label>Способ получения</label><select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} className="form-select"><option value="">Самовывоз (оплата сразу)</option><option value="Авито Доставка">Авито Доставка</option><option value="Курьер">Курьер</option><option value="СДЭК">СДЭК</option></select></div>
                </div>

                {deliveryMethod === "" && ( <> <h3>Платежи</h3> {payments.map((payment, index) => { const availablePaymentMethods = paymentMethodOptions.filter(option => !payments.some((p, i) => i !== index && p.payment_method && p.payment_method.value === option.value)); const allAccountOptions = accounts.map(a => ({ value: a.id, label: a.name })); let isAccountDisabled = false; let filteredAccountOptions = allAccountOptions; if (payment.payment_method) { const methodValue = payment.payment_method.value; if (methodValue === 'НАЛИЧНЫЕ' || methodValue === 'КАРТА') { isAccountDisabled = true; } else if (methodValue === 'ПЕРЕВОД') { filteredAccountOptions = allAccountOptions.filter( acc => acc.label.toLowerCase().includes('карта') ); } } return ( <div key={index} className="details-grid" style={{borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem'}}> <div className="form-section"> <label>Метод оплаты</label> <Select options={availablePaymentMethods} value={payment.payment_method} onChange={value => handlePaymentChange(index, 'payment_method', value)} /> </div> <div className="form-section"> <label>Счет зачисления</label> <Select options={filteredAccountOptions} value={payment.account_id} onChange={value => handlePaymentChange(index, 'account_id', value)} placeholder="Выберите счет..." isDisabled={isAccountDisabled} /> </div> <div className="form-section"> <label>Сумма (руб.)</label> <input type="number" step="0.01" className="form-input" value={payment.amount} onChange={e => handlePaymentChange(index, 'amount', e.target.value)} /> </div> {payments.length > 1 && ( <div style={{display: 'flex', alignItems: 'flex-end'}}> <button onClick={() => handleRemovePayment(index)} className="btn btn-danger btn-compact" style={{marginBottom: '0'}}> Удалить </button> </div> )} </div> ); })} <button onClick={handleAddPayment} className="btn btn-secondary">Добавить оплату</button> <div className="sale-total" style={{marginTop: '2rem'}}> <p>Сумма по чеку: <span>{subtotal.toFixed(2)} руб.</span></p> {paymentAdjustment > 0 && <p>Сервисный сбор (эквайринг): <span>{paymentAdjustment.toFixed(2)} руб.</span></p>} <div className="form-section" style={{ maxWidth: '300px', marginTop: '1rem' }}> <label>Скидка (руб.)</label> <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> <input type="number" value={discount} onChange={(e) => handleDiscountChange(e.target.value)} className="form-input" placeholder="0" /> <button type="button" onClick={handleTelegramDiscount} className="btn btn-secondary" style={{ margin: 0, padding: '10px 15px', whiteSpace: 'nowrap' }}>TG 2%</button> </div> </div> <h3>Итого к оплате: <span>{totalAmount.toFixed(2)} руб.</span></h3> <hr /> <p>Внесено: <span>{totalPaid.toFixed(2)} руб.</span></p> <h3 style={{color: Math.abs(remainingBalance) > 0.01 ? '#dc3545' : '#198754'}}>Осталось внести: <span>{remainingBalance.toFixed(2)} руб.</span></h3> </div> {payments.some(p => p.payment_method?.value === 'НАЛИЧНЫЕ') && ( <div className="details-grid" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}> <div className="form-section"> <label>Получено наличными (руб.)</label> <input type="number" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="form-input" /> </div> <div className="form-section"> <label>Сдача (руб.)</label> <input type="number" step="0.01" value={actualChangeGiven} readOnly={!customerDidNotTakeChange} onChange={(e) => setActualChangeGiven(e.target.value)} className="form-input" style={{ fontWeight: 'bold' }} /> {changeGiven > 0 && ( <div style={{ marginTop: '0.5rem' }}> <label> <input type="checkbox" checked={customerDidNotTakeChange} onChange={(e) => setCustomerDidNotTakeChange(e.target.checked)} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> <span style={{ verticalAlign: 'middle' }}>Клиент не забрал (всю) сдачу</span> </label> {customerDidNotTakeChange && ( <small style={{ display: 'block', marginTop: '4px', color: '#6c757d' }}> Укажите в поле "Сдача" ту сумму, которую вы фактически выдали клиенту. </small> )} </div> )} </div> </div> )} </> )}
                <div style={{ position: 'relative', minHeight: '80px' }}>
                        {isCashInsufficient && (
                            <p className="form-message error" style={{ textAlign: 'right', position: 'absolute', bottom: '60px', right: 0 }}>
                                Сумма наличных меньше, чем сумма к оплате!
                            </p>
                        )}
                        <button 
                            onClick={handleSubmitSale} 
                            className={`btn ${isCashInsufficient ? 'btn-danger' : 'btn-primary'}`} // Динамический класс
                            style={{ float: 'right' }} 
                            disabled={cart.length === 0 || isSubmitting || isCashInsufficient} // Динамическая блокировка
                        >
                            {isSubmitting ? 'Оформление...' : 'Оформить продажу'}
                        </button>
                </div>
                {error && <p className="form-message error" style={{marginTop: '4rem'}}>{error}</p>}
            </div>
            
            {saleSuccessData && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Продажа №{formatCheckNumber(saleSuccessData.id)} успешно оформлена!</h3>
                        <p>Итоговая сумма: <strong>{parseFloat(saleSuccessData.total_amount).toFixed(2)} руб.</strong></p>
                        <div className="confirm-modal-buttons">
                            <button onClick={() => printReceipt(saleSuccessData)} className="btn btn-secondary">Напечатать чек</button>

                            {/* Check for a phone in the sale before showing the warranty button */}
                            {saleSuccessData.details.some(item => item.serial_number) && (
                                <button onClick={() => printWarrantyCard(saleSuccessData)} className="btn btn-secondary">
                                    Печать гарантии
                                </button>
                            )}

                            <button onClick={handleResetAndConfirm} className="btn btn-primary">OK (Завершить)</button>
                        </div>
                    </div>
                </div>
            )}
            {isConfirmPrintModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Подтверждение</h3>
                        <p>Вы распечатали товарный чек для клиента?</p>
                        <div className="confirm-modal-buttons">
                            <button 
                                onClick={() => {
                                    resetSaleForm();
                                    setIsConfirmPrintModalOpen(false);
                                }} 
                                className="btn btn-primary"
                            >
                                Да, распечатал(а)
                            </button>
                            <button 
                                onClick={() => setIsConfirmPrintModalOpen(false)} 
                                className="btn btn-secondary"
                            >
                                Нет
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesPage;