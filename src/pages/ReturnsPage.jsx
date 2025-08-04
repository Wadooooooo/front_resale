import React, { useState, useEffect } from 'react';
import { 
    getDefectivePhones, 
    getPhonesSentToSupplier, 
    sendToSupplier, 
    returnFromSupplier,
    getReplacementModelOptions,
    replaceFromSupplier
} from '../api';
import './OrdersPage.css';

function ReturnsPage() {
    const [defectivePhones, setDefectivePhones] = useState([]);
    const [sentPhones, setSentPhones] = useState([]);
    const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [phoneToReplace, setPhoneToReplace] = useState(null);
    const [replacementOptions, setReplacementOptions] = useState([]);
    const [replacementData, setReplacementData] = useState({
        new_serial_number: '',
        new_model_id: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setMessage(''); // Сбрасываем сообщение при каждой загрузке
            const [defectiveData, sentData] = await Promise.all([
                getDefectivePhones(),
                getPhonesSentToSupplier()
            ]);
            setDefectivePhones(defectiveData);
            setSentPhones(sentData);
        } catch (error) {
            setMessage('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCheckboxChange = (phoneId) => {
        setSelectedPhoneIds(prev =>
            prev.includes(phoneId)
                ? prev.filter(id => id !== phoneId)
                : [...prev, phoneId]
        );
    };

    const handleSend = async () => {
        if (selectedPhoneIds.length === 0) {
            alert('Выберите хотя бы один телефон для отправки.');
            return;
        }
        try {
            await sendToSupplier(selectedPhoneIds);
            setMessage(`${selectedPhoneIds.length} телефон(ов) отмечены как отправленные.`);
            setSelectedPhoneIds([]);
            await loadData();
        } catch (error) {
            setMessage('Ошибка при отправке.');
        }
    };

    const handleReturn = async (phoneId) => {
        try {
            await returnFromSupplier(phoneId);
            setMessage(`Телефон ID ${phoneId} возвращен на инспекцию.`);
            await loadData();
        } catch (error) {
            setMessage('Ошибка при возврате от поставщика.');
        }
    };

    const handleOpenReplacementModal = async (phone) => {
        try {
            const options = await getReplacementModelOptions(phone.model.id);
            setReplacementOptions(options);
            setPhoneToReplace(phone);
            setReplacementData({ new_serial_number: '', new_model_id: String(phone.model.id) });
            setIsReplacementModalOpen(true);
        } catch (err) {
            alert('Не удалось загрузить варианты для замены.');
        }
    };

    const handleReplacementInputChange = (e) => {
        const { name, value } = e.target;
        setReplacementData(prev => ({ ...prev, [name]: value }));
    };

    const handleReplacementSubmit = async (e) => {
        e.preventDefault();
        if (!replacementData.new_serial_number || !replacementData.new_model_id) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }
        try {
            const dataToSend = {
                ...replacementData,
                new_model_id: parseInt(replacementData.new_model_id)
            };
            await replaceFromSupplier(phoneToReplace.id, dataToSend);
            setMessage(`Телефон S/N ${phoneToReplace.serial_number} успешно заменен на новый.`);
            setIsReplacementModalOpen(false);
            setPhoneToReplace(null);
            await loadData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Ошибка при оформлении замены.');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Брак и возвраты поставщику</h1>
            {message && <p className="form-message success">{message}</p>}

            {/* VVV ЭТОТ БЛОК БЫЛ ПРОПУЩЕН И ТЕПЕРЬ ВОЗВРАЩЕН VVV */}
            <div className="order-page-container">
                <h2>Брак на складе ({defectivePhones.length})</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Выбрать</th>
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
                <button onClick={handleSend} className="btn btn-primary" disabled={selectedPhoneIds.length === 0}>
                    Отправить выбранные ({selectedPhoneIds.length})
                </button>
            </div>

            <div className="order-page-container">
                <h2>Отправлено поставщику ({sentPhones.length})</h2>
                <table className="orders-table">
                     <thead>
                        <tr>
                            <th>ID</th>
                            <th>Модель</th>
                            <th>S/N</th>
                            <th>Причина отправки</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sentPhones.map(phone => (
                            <tr key={phone.id}>
                                <td>{phone.id}</td>
                                <td>{phone.model?.name || 'Нет данных'}</td>
                                <td>{phone.serial_number}</td>
                                <td>{phone.defect_reason || 'Не указана'}</td>
                                <td>
                                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                                        <button onClick={() => handleReturn(phone.id)} className="btn btn-secondary btn-compact">Принять (ремонт)</button>
                                        <button onClick={() => handleOpenReplacementModal(phone)} className="btn btn-primary btn-compact">Принять (замена)</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isReplacementModalOpen && phoneToReplace && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog">
                        <h3>Приёмка замены от поставщика</h3>
                        <p><strong>Заменяемый телефон:</strong> {phoneToReplace.model?.name} (S/N: {phoneToReplace.serial_number})</p>
                        <form onSubmit={handleReplacementSubmit} style={{textAlign: 'left'}}>
                            <div className="form-section">
                                <label>Новый серийный номер (S/N)*</label>
                                <input type="text" name="new_serial_number" value={replacementData.new_serial_number} onChange={handleReplacementInputChange} className="form-input" required />
                            </div>
                            <div className="form-section">
                                <label>Новая модель (цвет)*</label>
                                <select name="new_model_id" value={replacementData.new_model_id} onChange={handleReplacementInputChange} className="form-select" required>
                                    {replacementOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="confirm-modal-buttons">
                                <button type="submit" className="btn btn-primary">Подтвердить замену</button>
                                <button type="button" onClick={() => setIsReplacementModalOpen(false)} className="btn btn-secondary">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReturnsPage;