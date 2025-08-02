// src/pages/PhoneHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import {
    getPhoneHistory,
    getAccounts,
    processRefund,
    startWarrantyRepair,
    finishWarrantyRepair,
    getReplacementPhones,
    processExchange
} from '../api';
import './OrdersPage.css';
import './PhoneHistoryPage.css';
import { printRepairAcceptanceDoc, printRepairFinishDoc } from '../utils/printRepairDoc';
// 1. Убедитесь, что useParams импортирован
import { useParams } from 'react-router-dom';

// Вспомогательная функция для форматирования даты
const formatDateTime = (isoString) => {
    if (!isoString) return 'Нет данных';
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
};

// Вспомогательный компонент для отображения деталей лога с форматированием
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

// Обновленный компонент модального окна, который умеет блокировать кнопки
const ConfirmationModal = ({ title, message, onConfirm, onCancel, isSubmitting }) => (
    <div className="confirm-modal-overlay">
        <div className="confirm-modal-dialog">
            <h3>{title}</h3>
            <p>{message}</p>
            <div className="confirm-modal-buttons">
                <button onClick={onConfirm} className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Выполняется...' : 'OK'}
                </button>
                <button onClick={onCancel} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button>
            </div>
        </div>
    </div>
);


function PhoneHistoryPage() {
    // 2. Эта строка исправлена: теперь она получает параметр из URL
    const { serialNumber: serialFromUrl } = useParams();

    // 3. Эта строка исправлена: serialFromUrl теперь существует
    const [serialNumber, setSerialNumber] = useState(serialFromUrl || '');
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [refundAccountId, setRefundAccountId] = useState(null);
    const [refundNotes, setRefundNotes] = useState('');
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [replacementOptions, setReplacementOptions] = useState([]);
    const [selectedReplacementId, setSelectedReplacementId] = useState('');
    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const [acceptanceData, setAcceptanceData] = useState({
        customer_name: '',
        customer_phone: '',
        problem_description: '',
        device_condition: '',
        included_items: '',
        notes: ''
    });
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finishData, setFinishData] = useState({
        work_performed: ''
    });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Универсальная функция для поиска
    const findHistoryBySN = async (snToSearch) => {
        if (!snToSearch || !snToSearch.trim()) {
            setError('Введите серийный номер.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        setHistory(null);
        try {
            const data = await getPhoneHistory(snToSearch.trim());
            setHistory(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при поиске истории.');
        } finally {
            setLoading(false);
        }
    };

    // 4. Этот useEffect исправлен: он загружает данные при первом рендере
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const accountsData = await getAccounts();
                setAccounts(accountsData);
            } catch (err) {
                console.error("Не удалось загрузить счета", err);
            }
        };
        fetchInitialData();

        if (serialFromUrl) {
            findHistoryBySN(serialFromUrl);
        }
    }, [serialFromUrl]);


    // Обработчик для формы поиска
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        findHistoryBySN(serialNumber);
    };


    // --- ВАЖНО: Остальной код вашего компонента (все функции handle...Submit и т.д.) остается здесь без изменений ---
    // (Я его скрыл для краткости, но вы должны оставить его в своем файле)
    const handleAcceptanceInputChange = (e) => {
        const { name, value } = e.target;
        setAcceptanceData(prev => ({ ...prev, [name]: value }));
    };

    const handleAcceptanceSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await startWarrantyRepair(history.id, acceptanceData);
            setMessage('Телефон успешно принят в ремонт.');
            printRepairAcceptanceDoc(history, acceptanceData);
            setIsAcceptanceModalOpen(false);
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при приеме в ремонт.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinishInputChange = (e) => {
        const { name, value } = e.target;
        setFinishData(prev => ({ ...prev, [name]: value }));
    };

    const handleFinishSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await finishWarrantyRepair(history.id, finishData);
            setMessage('Ремонт успешно завершен.');
             printRepairFinishDoc(history, finishData);
            setIsFinishModalOpen(false);
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при завершении ремонта.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartRepair = () => setIsAcceptanceModalOpen(true);
    const handleFinishRepair = () => setIsFinishModalOpen(true);

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!refundAccountId) {
            alert('Пожалуйста, выберите счет для возврата средств.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const refundData = { account_id: refundAccountId.value, notes: refundNotes };
            await processRefund(history.id, refundData);
            setMessage('Возврат успешно оформлен!');
            setIsRefundModalOpen(false);
            setRefundAccountId(null);
            setRefundNotes('');
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Не удалось оформить возврат.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenExchangeModal = async () => {
        try {
            const replacements = await getReplacementPhones(history.id);
            setReplacementOptions(replacements);
            setIsExchangeModalOpen(true);
        } catch (err) {
            alert('Не удалось загрузить список телефонов для обмена.');
        }
    };

    const handleExchangeSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReplacementId) {
            alert('Пожалуйста, выберите телефон для обмена.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await processExchange(history.id, selectedReplacementId);
            setMessage('Обмен успешно выполнен!');
            setIsExchangeModalOpen(false);
            setSelectedReplacementId('');
            await findHistoryBySN(serialNumber);
        } catch (err) {
            alert(err.response?.data?.detail || 'Не удалось выполнить обмен.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    return (
        <div>
            <h1>История телефона</h1>
            <div className="order-page-container">
                <h2>Поиск по серийному номеру</h2>
                <form onSubmit={handleSearchSubmit} className="search-form-container">
                    <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Введите S/N..."
                        className="form-input"
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Поиск...' : 'Найти'}
                    </button>
                </form>
                {error && <p className="form-message error" style={{marginTop: '1rem'}}>{error}</p>}
                {message && <p className="form-message success" style={{marginTop: '1rem'}}>{message}</p>}
            </div>

            {history && (
                 <div className="order-page-container">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                            <h2>{history.model?.name || 'Телефон'} (ID: {history.id})</h2>
                            <p style={{ margin: '0.5rem 0' }}><strong>Серийный номер:</strong> {history.serial_number || 'Нет данных'}</p>
                            <p style={{ margin: '0.5rem 0' }}><strong>Текущий статус:</strong> {history.commercial_status || 'Нет данных'}</p>
                        </div>
                        <div>
                            {history.commercial_status === 'ПРОДАН' && (
                                <>
                                    <button onClick={() => setIsRefundModalOpen(true)} className="btn btn-danger">Возврат денег</button>
                                    <button onClick={handleOpenExchangeModal} className="btn btn-warning">Обмен</button>
                                    <button onClick={handleStartRepair} className="btn btn-secondary">В ремонт</button>
                                </>
                            )}
                            {history.commercial_status === 'ГАРАНТИЙНЫЙ_РЕМОНТ' && (
                                <button onClick={handleFinishRepair} className="btn btn-primary">Завершить ремонт</button>
                            )}
                            {history.commercial_status === 'ВОЗВРАТ' && (
                                <p style={{ color: '#6c757d', textAlign: 'right', margin: 0 }}>Телефон возвращен.<br />Управление на странице "Брак/Возвраты".</p>
                            )}
                        </div>
                    </div>
                    <hr />
                    <ul className="timeline">
                        {history.movement_logs && history.movement_logs.map((log) => (
                            <li key={log.id} className="timeline-item">
                                <div className="timeline-date">{formatDateTime(log.timestamp)}</div>
                                <div className="timeline-content">
                                    <h3>{log.event_type}</h3>
                                    <LogDetails details={log.details} />
                                    {log.user && <small style={{ color: '#6c757d' }}>Пользователь: {log.user.name || log.user.username}</small>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Модальные окна */}
            {confirmModal.isOpen && <ConfirmationModal {...confirmModal} onCancel={() => setConfirmModal({ isOpen: false })} isSubmitting={isSubmitting} />}

            {isAcceptanceModalOpen && (
                <div className="confirm-modal-overlay">
                    <form onSubmit={handleAcceptanceSubmit} className="confirm-modal-dialog" style={{textAlign: 'left', maxWidth: '600px'}}>
                        <h3>Акт приёма в гарантийный ремонт</h3>
                        <p><strong>Устройство:</strong> {history.model?.name} (S/N: {history.serial_number})</p>
                        <div className="details-grid">
                            <div className="form-section">
                                <label>Имя клиента*</label>
                                <input name="customer_name" value={acceptanceData.customer_name} onChange={handleAcceptanceInputChange} className="form-input" required/>
                            </div>
                            <div className="form-section">
                                <label>Телефон клиента*</label>
                                    <IMaskInput
                                        mask="+7 (000) 000-00-00"
                                        value={acceptanceData.customer_phone}
                                        onAccept={(value) => handleAcceptanceInputChange({ target: { name: 'customer_phone', value: value } })}
                                        name="customer_phone"
                                        className="form-input"
                                        required
                                        placeholder="+7 (___) ___-__-__"
                                    />
                            </div>
                        </div>
                        <div className="form-section">
                            <label>Заявленная неисправность (со слов клиента)*</label>
                            <textarea name="problem_description" value={acceptanceData.problem_description} onChange={handleAcceptanceInputChange} className="form-input" rows="3" required></textarea>
                        </div>
                        <div className="form-section">
                            <label>Внешнее состояние (описание)*</label>
                            <textarea name="device_condition" value={acceptanceData.device_condition} onChange={handleAcceptanceInputChange} className="form-input" rows="3" required></textarea>
                        </div>
                        <div className="form-section">
                            <label>Комплектация</label>
                            <input name="included_items" value={acceptanceData.included_items} onChange={handleAcceptanceInputChange} className="form-input" />
                        </div>
                        <div className="form-section">
                            <label>Примечания</label>
                            <textarea name="notes" value={acceptanceData.notes} onChange={handleAcceptanceInputChange} className="form-input" rows="2"></textarea>
                        </div>
                        <div className="confirm-modal-buttons">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Принять в ремонт'}</button>
                            <button type="button" onClick={() => setIsAcceptanceModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button>
                        </div>
                    </form>
                </div>
            )}

            {isFinishModalOpen && (
                 <div className="confirm-modal-overlay">
                    <form onSubmit={handleFinishSubmit} className="confirm-modal-dialog" style={{textAlign: 'left', maxWidth: '600px'}}>
                        <h3>Акт выдачи из ремонта</h3>
                        <p><strong>Устройство:</strong> {history.model?.name} (S/N: {history.serial_number})</p>
                        <div className="form-section">
                            <label>Проведенные работы*</label>
                            <textarea name="work_performed" value={finishData.work_performed} onChange={handleFinishInputChange} className="form-input" rows="4" required></textarea>
                        </div>
                        <div className="confirm-modal-buttons">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Завершить ремонт'}</button>
                            <button type="button" onClick={() => setIsFinishModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button>
                        </div>
                    </form>
                </div>
            )}

            {isExchangeModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Обмен устройства</h3>
                        <p><strong>{history.model?.name}</strong></p>
                        <form onSubmit={handleExchangeSubmit}>
                            <div className="form-section" style={{textAlign: 'left'}}>
                                <label>Выберите телефон на замену со склада:</label>
                                {replacementOptions.length > 0 ? (
                                    <select value={selectedReplacementId} onChange={(e) => setSelectedReplacementId(e.target.value)} className="form-select" required>
                                        <option value="">-- Доступные телефоны --</option>
                                        {replacementOptions.map(phone => (
                                            <option key={phone.id} value={phone.id}>
                                                {phone.full_model_name} (S/N: {phone.serial_number || 'не указан'})
                                            </option>
                                        ))}
                                    </select>
                                ) : (<p>На складе нет подходящих телефонов для обмена.</p>)}
                            </div>
                            <div className="confirm-modal-buttons">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting || replacementOptions.length === 0}>{isSubmitting ? 'Выполняется...' : 'Подтвердить обмен'}</button>
                                <button type="button" onClick={() => setIsExchangeModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isRefundModalOpen && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Оформление возврата</h3>
                        <p>Телефон: <strong>{history.model?.name}</strong></p>
                        <p>Сумма к возврату: <strong>{history.sale_info?.unit_price} руб.</strong></p>
                        <form onSubmit={handleRefundSubmit}>
                            <div className="form-section" style={{textAlign: 'left'}}>
                                <label>Счет для списания средств*</label>
                                <Select options={accountOptions} value={refundAccountId} onChange={setRefundAccountId} placeholder="Выберите счет..." required />
                            </div>
                            <div className="form-section" style={{textAlign: 'left'}}>
                                <label>Примечание</label>
                                <textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} className="form-input" rows="3"></textarea>
                            </div>
                            <div className="confirm-modal-buttons">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Выполняется...' : 'Подтвердить возврат'}</button>
                                <button type="button" onClick={() => setIsRefundModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhoneHistoryPage;