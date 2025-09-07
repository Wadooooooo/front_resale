// src/pages/PhoneHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import {
    getPhoneHistory, getAccounts, processRefund, startRepair, 
    finishRepair, getReplacementPhones, processExchange, payForRepair,
    getAvailableLoanerPhones, issueLoanerPhone, returnLoanerPhone,
    getSaleById, cancelSale 
} from '../api';
import './OrdersPage.css';
import './PhoneHistoryPage.css';
import { printRepairAcceptanceDoc, printRepairFinishDoc, printLoanerIssuanceDoc, printLoanerReturnDoc } from '../utils/printRepairDoc';
import { printReceipt } from '../utils/printReceipt';
import { printWarrantyCard } from '../utils/printWarrantyCard';
import { useParams } from 'react-router-dom';

const formatDateTime = (isoString) => {
    if (!isoString) return 'Нет данных';
    const date = new Date(isoString + 'Z');
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
};

const LogDetails = ({ details }) => {
  if (!details) return null;
  const parts = details.split('--- Результаты проверки ---');
  const mainMessage = parts[0];
  const checklistStr = parts[1];
  return (
    <div>
      <p style={{ marginBottom: checklistStr ? '0.5rem' : '0' }}>{mainMessage.trim()}</p>
      {checklistStr && (
        <ul className="timeline-checklist-details">
          {checklistStr.trim().split('\n').map((line, index) => {
            const lineParts = line.split(':');
            const itemName = lineParts[0].replace(/^- /, '');
            const statusText = lineParts.slice(1).join(':').trim();
            let statusElement;
            if (statusText.startsWith('Пройдено')) {
              statusElement = <span className="status-pass">{statusText}</span>;
            } else if (statusText.startsWith('БРАК')) {
              statusElement = <span className="status-fail">{statusText}</span>;
            } else {
              statusElement = <span>{statusText}</span>;
            }
            return <li key={index}>{itemName}: {statusElement}</li>;
          })}
        </ul>
      )}
    </div>
  );
};


function PhoneHistoryPage() {
    const { serialNumber: serialFromUrl } = useParams();
    const [serialNumber, setSerialNumber] = useState(serialFromUrl || '');
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // Состояния для модальных окон
    const [accounts, setAccounts] = useState([]);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundAccountId, setRefundAccountId] = useState(null);
    const [refundNotes, setRefundNotes] = useState('');

    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [replacementOptions, setReplacementOptions] = useState([]);
    const [selectedReplacementId, setSelectedReplacementId] = useState('');

    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const [acceptanceData, setAcceptanceData] = useState({
        repair_type: 'ГАРАНТИЙНЫЙ', estimated_cost: '', customer_name: '', customer_phone: '',
        problem_description: '', device_condition: 'Присутствуют следы эксплуатации', included_items: 'Только устройство', notes: ''
    });

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finishData, setFinishData] = useState({ 
        work_performed: '', final_cost: '', service_cost: '', expense_account_id: null 
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAccountId, setPaymentAccountId] = useState(null);

    const [isLoanerModalOpen, setIsLoanerModalOpen] = useState(false);
    const [availableLoaners, setAvailableLoaners] = useState([]);
    const [selectedLoanerId, setSelectedLoanerId] = useState('');

    const [isReturnLoanerModalOpen, setIsReturnLoanerModalOpen] = useState(false);
    const [loanerLogToReturn, setLoanerLogToReturn] = useState(null);
    const [notification, setNotification] = useState({ isOpen: false, message: '' });

    // Новые состояния для модального окна печати
    const [updatedSaleData, setUpdatedSaleData] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);


    const findHistoryBySN = async (snToSearch) => {
        if (!snToSearch || !snToSearch.trim()) { setError('Введите серийный номер.'); return; }
        setLoading(true); setError(''); setMessage(''); setHistory(null);
        try {
            const data = await getPhoneHistory(snToSearch.trim());
            setHistory(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при поиске истории.');
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const accountsData = await getAccounts();
                setAccounts(accountsData);
            } catch (err) { console.error("Не удалось загрузить счета", err); }
        };
        fetchInitialData();
        if (serialFromUrl) { findHistoryBySN(serialFromUrl); }
    }, [serialFromUrl]);

    const handleSearchSubmit = (e) => { e.preventDefault(); findHistoryBySN(serialNumber); };
    const handleAcceptanceInputChange = (e) => { const { name, value } = e.target; setAcceptanceData(prev => ({ ...prev, [name]: value })); };
    const handleAcceptanceSubmit = async (e) => { e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true); try { const dataToSend = { ...acceptanceData, estimated_cost: acceptanceData.estimated_cost ? parseFloat(acceptanceData.estimated_cost) : null }; await startRepair(history.id, dataToSend); setMessage('Телефон успешно принят в ремонт.'); printRepairAcceptanceDoc(history, acceptanceData); setIsAcceptanceModalOpen(false); await findHistoryBySN(serialNumber); } catch (err) { alert(err.response?.data?.detail || 'Ошибка при приеме в ремонт.'); } finally { setIsSubmitting(false); } };
    const handleFinishInputChange = (e) => { const { name, value } = e.target; setFinishData(prev => ({ ...prev, [name]: value })); };
    const handleFinishSelectChange = (selectedOption) => { setFinishData(prev => ({ ...prev, expense_account_id: selectedOption })); };
    const handleFinishSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const currentRepair = history.repairs.find(r => !r.date_returned);
        if (!currentRepair) {
            alert("Не удалось найти активный ремонт для этого телефона.");
            return;
        }
        setIsSubmitting(true);
        try {
            const dataToSend = {
                work_performed: finishData.work_performed,
                final_cost: finishData.final_cost ? parseFloat(finishData.final_cost) : null,
                service_cost: finishData.service_cost ? parseFloat(finishData.service_cost) : null,
                expense_account_id: finishData.expense_account_id ? finishData.expense_account_id.value : null
            };
            await finishRepair(currentRepair.id, dataToSend);
            setMessage('Ремонт успешно завершен.');
            printRepairFinishDoc(history, currentRepair, finishData);
            setIsFinishModalOpen(false);
            setFinishData({ work_performed: '', final_cost: '', service_cost: '', expense_account_id: null });
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при завершении ремонта.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handlePaymentSubmit = async (e) => { e.preventDefault(); if(!paymentAccountId) { alert("Выберите счет для оплаты"); return; } if (isSubmitting) return; setIsSubmitting(true); try { const repairToPay = history.repairs.find(r => r.date_returned && r.payment_status === 'ОЖИДАНИЕ ОПЛАТЫ'); const paymentData = { account_id: paymentAccountId.value, amount: repairToPay.final_cost }; await payForRepair(repairToPay.id, paymentData); setMessage('Оплата за ремонт успешно принята!'); setIsPaymentModalOpen(false); await findHistoryBySN(serialNumber); } catch(err) { alert(err.response?.data?.detail || 'Ошибка при приеме оплаты.'); } finally { setIsSubmitting(false); } };
    const handleRefundSubmit = async (e) => { e.preventDefault(); if (!refundAccountId) { alert('Пожалуйста, выберите счет для возврата средств.'); return; } if (isSubmitting) return; setIsSubmitting(true); try { const refundData = { account_id: refundAccountId.value, notes: refundNotes }; await processRefund(history.id, refundData); setMessage('Возврат успешно оформлен!'); setIsRefundModalOpen(false); setRefundAccountId(null); setRefundNotes(''); await findHistoryBySN(serialNumber); } catch (err) { alert(err.response?.data?.detail || 'Не удалось оформить возврат.'); } finally { setIsSubmitting(false); } };
    const handleOpenExchangeModal = async () => { try { const replacements = await getReplacementPhones(history.id); setReplacementOptions(replacements); setIsExchangeModalOpen(true); } catch (err) { alert('Не удалось загрузить список телефонов для обмена.'); } };

    // --- ОБНОВЛЕННАЯ ФУНКЦИЯ ОБМЕНА ---
    const handleExchangeSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReplacementId) {
            alert('Пожалуйста, выберите телефон для обмена.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Выполняем обмен, получаем ID продажи
            const response = await processExchange(history.id, selectedReplacementId);
            const originalSaleId = response.sale_id;

            // Запрашиваем обновленные данные чека
            const freshSaleData = await getSaleById(originalSaleId);
            setUpdatedSaleData(freshSaleData);

            setMessage('Обмен успешно выполнен!');
            setIsExchangeModalOpen(false);
            setSelectedReplacementId('');
            setIsPrintModalOpen(true); // Открываем новое окно с предложением печати

        } catch (err) {
            alert(err.response?.data?.detail || 'Не удалось выполнить обмен.');
            setIsSubmitting(false);
        }
    };

    const handleJustClose = () => {
        setIsPrintModalOpen(false);
        setUpdatedSaleData(null);
        setIsSubmitting(false);
        findHistoryBySN(serialNumber);
    };

    const handleOpenLoanerModal = async () => { setIsSubmitting(true); try { const loaners = await getAvailableLoanerPhones(); setAvailableLoaners(loaners); setIsLoanerModalOpen(true); } catch (err) { alert('Не удалось загрузить список доступных телефонов.'); } finally { setIsSubmitting(false); } };
    const handleIssueLoanerSubmit = async (e) => { e.preventDefault(); if (!selectedLoanerId) { alert('Выберите подменный телефон.'); return; } if (isSubmitting) return; setIsSubmitting(true); try { const currentRepair = history.repairs.find(r => !r.date_returned); await issueLoanerPhone(currentRepair.id, selectedLoanerId); const selectedLoanerObject = availableLoaners.find(p => p.id === parseInt(selectedLoanerId)); if (selectedLoanerObject) { printLoanerIssuanceDoc(history, selectedLoanerObject, currentRepair); } setMessage('Подменный телефон успешно выдан.'); setIsLoanerModalOpen(false); setSelectedLoanerId(''); await findHistoryBySN(serialNumber); } catch (err) { alert(err.response?.data?.detail || 'Ошибка при выдаче подменного телефона.'); } finally { setIsSubmitting(false); } };
    const openReturnLoanerModal = (loanerLogId) => { setLoanerLogToReturn(loanerLogId); setIsReturnLoanerModalOpen(true); };
    const confirmAndReturnLoaner = async () => {
        if (!loanerLogToReturn) return;
        setIsSubmitting(true);
        try {
            await returnLoanerPhone(loanerLogToReturn);
            const currentRepair = history.repairs.find(r => r.active_loaner?.id === loanerLogToReturn);
            let loanerName = "Неизвестно";
            let loanerSN = "";
            if (currentRepair && currentRepair.active_loaner) {
                const detailsString = currentRepair.active_loaner.loaner_phone_details;
                const snMatch = detailsString.match(/\(S\/N: (.*?)\)/);
                if (snMatch && snMatch[1]) {
                    loanerSN = snMatch[1];
                    loanerName = detailsString.split('(S/N:')[0].replace(/ID: \d+, /, '').trim();
                } else {
                    loanerName = detailsString;
                }
            }
            const loanerPhone = { name: loanerName, serial_number: loanerSN };
            if (currentRepair) {
                printLoanerReturnDoc(history, loanerPhone, currentRepair);
            }
            setMessage('Подменный телефон принят на склад и отправлен на инспекцию.');
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при возврате.');
        } finally {
            setIsSubmitting(false);
            setIsReturnLoanerModalOpen(false);
            setLoanerLogToReturn(null);
        }
    };
    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    const currentRepair = history?.repairs?.find(r => !r.date_returned);
    const repairAwaitingPayment = history?.repairs?.find(r => r.date_returned && r.payment_status === 'ОЖИДАНИЕ ОПЛАТЫ');

    const getDisplayStatus = () => {
        if (!history) return '';
        if (history.commercial_status !== 'В_РЕМОНТЕ') {
            return formatEnumValueForDisplay(history.commercial_status);
        }
        if (repairAwaitingPayment) {
            return 'Ожидает оплаты за ремонт';
        }
        if (currentRepair) {
            return currentRepair.repair_type === 'ПЛАТНЫЙ' ? 'В платном ремонте' : 'В гарантийном ремонте';
        }
        return 'В ремонте';
    };

    const handleConfirmCancel = async () => {
        if (!history || !history.sale_info || !history.sale_info.sale_id) {
            setError('Не найдена информация о продаже для этого телефона. Отмена невозможна.');
            setIsCancelModalOpen(false); // Закрываем модальное окно, чтобы показать ошибку
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(''); // Сбрасываем предыдущую ошибку
        try {
            await cancelSale(history.sale_info.sale_id);
            setMessage('Продажа успешно отменена. Телефон возвращен на склад.');
            setIsCancelModalOpen(false);
            await findHistoryBySN(serialNumber); // Обновляем данные
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось отменить продажу.');
            setIsCancelModalOpen(false); // Закрываем модальное окно, чтобы была видна ошибка
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatEnumValueForDisplay = (value) => {
        if (!value) return "";
        return value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
    };

    return (
        <div>
            <h1>История телефона</h1>
             <div className="order-page-container">
                <h2>Поиск по серийному номеру</h2>
                <form onSubmit={handleSearchSubmit} className="search-form-container">
                    <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Введите S/N..." className="form-input"/>
                    <button type="submit" className="btn btn-primary" disabled={loading}> {loading ? 'Поиск...' : 'Найти'} </button>
                </form>
                {error && <p className="form-message error" style={{marginTop: '1rem'}}>{error}</p>}
                {message && <p className="form-message success" style={{marginTop: '1rem'}}>{message}</p>}
            </div>

            {history && (
                 <div className="order-page-container">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                            <h2>{history.model?.name || 'Телефон'} (ID: {history.id})</h2>
                            <p style={{ margin: '0.5rem' }}><strong>Серийный номер:</strong> {history.serial_number || 'Нет данных'}</p>
                            <p style={{ margin: '0.5rem' }}><strong>Текущий статус:</strong> {getDisplayStatus()}</p>
                            {currentRepair?.active_loaner && ( <p style={{ margin: '0.5rem', padding: '0.5rem', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}><strong>Выдан подменный:</strong> {currentRepair.active_loaner.loaner_phone_details}</p> )}
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem'}}>
                            {history.commercial_status === 'ПРОДАН' && ( 
                                <> 
                                    <button onClick={() => setIsCancelModalOpen(true)} className="btn btn-secondary">Отменить продажу (ошибка)</button>
                                    <button onClick={() => setIsRefundModalOpen(true)} className="btn btn-danger">Возврат денег (брак)</button> 
                                    <button onClick={handleOpenExchangeModal} className="btn btn-warning">Обмен устройства</button> 
                                    <button onClick={() => setIsAcceptanceModalOpen(true)} className="btn btn-secondary">В ремонт</button> 
                                </> 
                            )}
                            {currentRepair && !currentRepair.date_returned && ( <> 
                            <button 
                                onClick={() => {
                                    if (currentRepair.active_loaner) {
                                        setNotification({ isOpen: true, message: 'Невозможно завершить ремонт! Сначала необходимо принять подменный телефон от клиента.' });
                                    } else {
                                        setIsFinishModalOpen(true);
                                    }
                                }} 
                                className="btn btn-primary"
                            >
                                Завершить ремонт
                            </button>      
                            {!currentRepair.active_loaner && <button onClick={handleOpenLoanerModal} className="btn btn-info" disabled={isSubmitting}>Выдать подменный</button>} </> )}

                            {currentRepair?.active_loaner && ( <button onClick={() => openReturnLoanerModal(currentRepair.active_loaner.id)} className="btn btn-secondary" disabled={isSubmitting}>Принять подменный</button> )}

                            {repairAwaitingPayment && (
                                <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-success">Принять оплату ({repairAwaitingPayment.final_cost} руб.)</button>
                            )}
                        </div>
                    </div>
                    <hr />
                     <ul className="timeline">
                        {history.movement_logs && history.movement_logs.map((log) => ( <li key={log.id} className="timeline-item"> <div className="timeline-date">{formatDateTime(log.timestamp)}</div> <div className="timeline-content"> <h3>{log.event_type}</h3> <LogDetails details={log.details} /> {log.user && <small style={{ color: '#6c757d' }}>Пользователь: {log.user.name || log.user.username}</small>} </div> </li> ))}
                    </ul>
                </div>
            )}

            {isLoanerModalOpen && ( <div className="confirm-modal-overlay"> <form onSubmit={handleIssueLoanerSubmit} className="confirm-modal-dialog" style={{textAlign: 'left'}}> <h3>Выдать подменный телефон</h3> <div className="form-section"> <label>Выберите устройство со склада</label> <select value={selectedLoanerId} onChange={e => setSelectedLoanerId(e.target.value)} className="form-select" required> <option value="">-- Доступные телефоны --</option> {availableLoaners.map(phone => ( <option key={phone.id} value={phone.id}> {phone.name} (S/N: {phone.serial_number || 'б/н'}) </option> ))} </select> </div> <div className="confirm-modal-buttons"> <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Выдача...' : 'Выдать телефон'}</button> <button type="button" onClick={() => setIsLoanerModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button> </div> </form> </div> )}
            {isAcceptanceModalOpen && ( <div className="confirm-modal-overlay"> <form onSubmit={handleAcceptanceSubmit} className="confirm-modal-dialog" style={{textAlign: 'left', maxWidth: '600px'}}> <h3>Акт приёма в ремонт</h3> <div className="form-section"> <label>Тип ремонта</label> <div style={{display: 'flex', gap: '1rem'}}> <label><input type="radio" name="repair_type" value="ГАРАНТИЙНЫЙ" checked={acceptanceData.repair_type === 'ГАРАНТИЙНЫЙ'} onChange={handleAcceptanceInputChange}/> Гарантийный</label> <label><input type="radio" name="repair_type" value="ПЛАТНЫЙ" checked={acceptanceData.repair_type === 'ПЛАТНЫЙ'} onChange={handleAcceptanceInputChange}/> Платный</label> </div> </div> {acceptanceData.repair_type === 'ПЛАТНЫЙ' && ( <div className="form-section"><label>Предварительная стоимость (руб.)</label><input type="number" name="estimated_cost" value={acceptanceData.estimated_cost} onChange={handleAcceptanceInputChange} className="form-input"/></div> )} <div className="details-grid"> <div className="form-section"><label>Имя клиента*</label><input name="customer_name" value={acceptanceData.customer_name} onChange={handleAcceptanceInputChange} className="form-input" required/></div> <div className="form-section"><label>Телефон клиента*</label><IMaskInput mask="+7 (000) 000-00-00" value={acceptanceData.customer_phone} onAccept={(value) => handleAcceptanceInputChange({ target: { name: 'customer_phone', value: value } })} name="customer_phone" className="form-input" required placeholder="+7 (___) ___-__-__"/></div> </div> <div className="form-section"><label>Заявленная неисправность*</label><textarea name="problem_description" value={acceptanceData.problem_description} onChange={handleAcceptanceInputChange} className="form-input" rows="3" required></textarea></div> <div className="form-section"><label>Внешнее состояние*</label><textarea name="device_condition" value={acceptanceData.device_condition} onChange={handleAcceptanceInputChange} className="form-input" rows="3" required></textarea></div> <div className="form-section"><label>Комплектация</label><input name="included_items" value={acceptanceData.included_items} onChange={handleAcceptanceInputChange} className="form-input" /></div> <div className="form-section"><label>Примечания</label><textarea name="notes" value={acceptanceData.notes} onChange={handleAcceptanceInputChange} className="form-input" rows="2"></textarea></div> <div className="confirm-modal-buttons"><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Принять в ремонт'}</button><button type="button" onClick={() => setIsAcceptanceModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button></div> </form> </div> )}
            {isFinishModalOpen && ( <div className="confirm-modal-overlay"> <form onSubmit={handleFinishSubmit} className="confirm-modal-dialog" style={{textAlign: 'left', maxWidth: '600px'}}> <h3>Акт выдачи из ремонта</h3> {currentRepair?.repair_type === 'ПЛАТНЫЙ' && ( <> <div className="form-section"><label>Итоговая стоимость (для клиента)*</label><input type="number" name="final_cost" value={finishData.final_cost} onChange={handleFinishInputChange} className="form-input" required/></div> <div className="form-section"><label>Себестоимость ремонта (оплата мастеру)</label><input type="number" name="service_cost" value={finishData.service_cost} onChange={handleFinishInputChange} className="form-input" placeholder="0.00"/></div> <div className="form-section"><label>Счет списания (оплата мастеру)</label><Select options={accountOptions} value={finishData.expense_account_id} onChange={handleFinishSelectChange} placeholder="Выберите счет..." /></div> </> )} <div className="form-section"><label>Проведенные работы*</label><textarea name="work_performed" value={finishData.work_performed} onChange={handleFinishInputChange} className="form-input" rows="4" required></textarea></div> <div className="confirm-modal-buttons"><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Завершить ремонт'}</button><button type="button" onClick={() => setIsFinishModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button></div> </form> </div> )}
            {isPaymentModalOpen && repairAwaitingPayment && ( <div className="confirm-modal-overlay"> <form onSubmit={handlePaymentSubmit} className="confirm-modal-dialog"> <h3>Прием оплаты за ремонт</h3> <p>Сумма к оплате: <strong>{repairAwaitingPayment.final_cost} руб.</strong></p> <div className="form-section" style={{textAlign: 'left'}}><label>Счет для зачисления*</label><Select options={accountOptions} value={paymentAccountId} onChange={setPaymentAccountId} placeholder="Выберите счет..." required /></div> <div className="confirm-modal-buttons"><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Принять оплату' : 'Принять оплату'}</button><button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button></div> </form> </div> )}
            {isExchangeModalOpen && ( <div className="confirm-modal-overlay"> <div className="confirm-modal-dialog"> <h3>Обмен устройства</h3> <p><strong>{history.model?.name}</strong></p> <form onSubmit={handleExchangeSubmit}> <div className="form-section" style={{textAlign: 'left'}}> <label>Выберите телефон на замену со склада:</label> {replacementOptions.length > 0 ? ( <select value={selectedReplacementId} onChange={(e) => setSelectedReplacementId(e.target.value)} className="form-select" required> <option value="">-- Доступные телефоны --</option> {replacementOptions.map(phone => ( <option key={phone.id} value={phone.id}> {phone.full_model_name} (S/N: {phone.serial_number || 'не указан'}) </option> ))} </select> ) : (<p>На складе нет подходящих телефонов для обмена.</p>)} </div> <div className="confirm-modal-buttons"> <button type="submit" className="btn btn-primary" disabled={isSubmitting || replacementOptions.length === 0}>{isSubmitting ? 'Выполняется...' : 'Подтвердить обмен'}</button> <button type="button" onClick={() => setIsExchangeModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button> </div> </form> </div> </div> )}
            {isRefundModalOpen && ( <div className="confirm-modal-overlay"> <div className="confirm-modal-dialog"> <h3>Оформление возврата</h3> <p>Телефон: <strong>{history.model?.name}</strong></p> <p>Сумма к возврату: <strong>{history.sale_info?.unit_price} руб.</strong></p> <form onSubmit={handleRefundSubmit}> <div className="form-section" style={{textAlign: 'left'}}> <label>Счет для списания средств*</label> <Select options={accountOptions} value={refundAccountId} onChange={setRefundAccountId} placeholder="Выберите счет..." required /> </div> <div className="form-section" style={{textAlign: 'left'}}> <label>Примечание</label> <textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} className="form-input" rows="3"></textarea> </div> <div className="confirm-modal-buttons"> <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Выполняется...' : 'Подтвердить возврат'}</button> <button type="button" onClick={() => setIsRefundModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button> </div> </form> </div> </div> )}
            {isReturnLoanerModalOpen && ( <div className="confirm-modal-overlay"> <div className="confirm-modal-dialog"> <h3>Подтверждение возврата</h3> <p>Вы уверены, что хотите принять подменный телефон обратно на склад? Будет распечатан акт возврата.</p> <div className="confirm-modal-buttons"> <button onClick={confirmAndReturnLoaner} className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Обработка...' : 'Да, принять'}</button> <button onClick={() => setIsReturnLoanerModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button> </div> </div> </div> )}
            {notification.isOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Уведомление</h3>
                        <p>{notification.message}</p>
                        <div className="confirm-modal-buttons">
                            <button 
                                onClick={() => setNotification({ isOpen: false, message: '' })} 
                                className="btn btn-primary"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPrintModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Обмен выполнен</h3>
                        <p>Распечатать новый товарный чек и гарантийный талон?</p>
                        <div className="confirm-modal-buttons">
                            <button onClick={() => { if (updatedSaleData) printReceipt(updatedSaleData); }} className="btn btn-secondary">Напечатать чек</button>

                            {updatedSaleData && updatedSaleData.details.some(item => item.serial_number) && (
                                <button onClick={() => printWarrantyCard(updatedSaleData)} className="btn btn-secondary">
                                    Печать гарантии
                                </button>
                            )}

                            <button onClick={handleJustClose} className="btn btn-primary">Завершить</button>
                        </div>
                    </div>
                </div>
            )}
            {isCancelModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Подтверждение отмены продажи</h3>
                        <p>Вы уверены, что хотите отменить продажу? Это действие полностью аннулирует финансовую операцию и вернет телефон на склад.</p>
                        <div className="confirm-modal-buttons">
                            <button onClick={handleConfirmCancel} className="btn btn-warning" disabled={isSubmitting}>{isSubmitting ? 'Отмена...' : 'Да, отменить продажу'}</button>
                            <button onClick={() => setIsCancelModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Закрыть</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhoneHistoryPage;