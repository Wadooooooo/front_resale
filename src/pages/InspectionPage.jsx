import React, { useState, useEffect } from 'react';
import {
    getPhonesForInspection,
    getPhonesForBatteryTest,
    getChecklistItems,
    submitInitialInspection,
    addBatteryTest,
    searchModelNumbers,
    getPhonesForPackaging,
    submitPackaging
} from '../api';
import './OrdersPage.css';

function InspectionPage() {
    const [awaitingChecklist, setAwaitingChecklist] = useState([]);
    const [awaitingBatteryTest, setAwaitingBatteryTest] = useState([]);
    const [awaitingPackaging, setAwaitingPackaging] = useState([]);
    const [selectedForPackaging, setSelectedForPackaging] = useState([]);
    
    const [checklist, setChecklist] = useState([]);
    const [selectedPhone, setSelectedPhone] = useState(null);
    const [currentInspection, setCurrentInspection] = useState(null);
    
    const [serialNumber, setSerialNumber] = useState('');
    const [modelNumber, setModelNumber] = useState('');
    const [modelNumberSuggestions, setModelNumberSuggestions] = useState([]);
    const [results, setResults] = useState({});
    const [batteryTest, setBatteryTest] = useState({
        start_time: '', start_battery_level: '', end_time: '', end_battery_level: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [drainRate, setDrainRate] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [checklistPhones, batteryPhones, checklistData, packagingPhones] = await Promise.all([
                getPhonesForInspection(),
                getPhonesForBatteryTest(),
                getChecklistItems(),
                getPhonesForPackaging()
            ]);
            setAwaitingChecklist(checklistPhones);
            setAwaitingBatteryTest(batteryPhones);
            setChecklist(checklistData);
            setAwaitingPackaging(packagingPhones);
        } catch (err) {
            setError('Не удалось загрузить данные для инспекции.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);


    useEffect(() => {
    // Создаем таймер
    const timer = setTimeout(async () => {
        if (modelNumber.length > 1) { // Начинаем поиск после 2-х символов
            const suggestions = await searchModelNumbers(modelNumber);
            setModelNumberSuggestions(suggestions);
        } else {
            setModelNumberSuggestions([]);
        }
    }, 300); // Задержка в 300 мс

    // Очищаем таймер при каждом новом вводе
    return () => clearTimeout(timer);
}, [modelNumber]); // Этот хук зависит от ввода в поле номера модели


    // --- 2. ЛОГИКА РАСЧЕТА РАСХОДА БАТАРЕИ (без изменений) ---
    useEffect(() => {
        const { start_time, end_time, start_battery_level, end_battery_level } = batteryTest;

        if (start_time && end_time && start_battery_level && end_battery_level) {
            const startTime = new Date(start_time);
            const endTime = new Date(end_time);
            const startLevel = parseInt(start_battery_level, 10);
            const endLevel = parseInt(end_battery_level, 10);

            if (endTime > startTime && startLevel >= endLevel) {
                const durationMs = endTime.getTime() - startTime.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                const batteryDropped = startLevel - endLevel;
                
                if (durationHours > 0) {
                    const rate = batteryDropped / durationHours;
                    setDrainRate(rate.toFixed(2));
                } else {
                    setDrainRate(null);
                }
            } else {
                setDrainRate(null);
            }
        } else {
            setDrainRate(null);
        }
    }, [batteryTest]);

    
    // --- 3. ОБРАБОТЧИКИ СОБЫТИЙ ---

    // Сброс формы в начальное состояние
    const resetForm = () => {
        setSelectedPhone(null);
        setCurrentInspection(null);
        setSerialNumber('');
        setResults({});
        setBatteryTest({ start_time: '', start_battery_level: '', end_time: '', end_battery_level: '' });
        setMessage('');
        setError('');
    };

    // Выбор телефона для НАЧАЛЬНОЙ ПРОВЕРКИ (чек-лист)
    const handleSelectForChecklist = (phone) => {
        resetForm();
        setSelectedPhone(phone);

        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        // Предзаполняем поля данными из объекта phone
        setSerialNumber(phone.serial_number || '');
        setModelNumber(phone.model_number?.name || ''); // Используем опциональную цепочку ?.
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

        // Готовим пустой чек-лист, где все пункты пройдены по умолчанию
        const initialResults = {};
        checklist.forEach(item => {
            initialResults[item.id] = { result: true, notes: '' };
        });
        setResults(initialResults);
    };

    // Выбор телефона для ТЕСТА АККУМУЛЯТОРА
    const handleSelectForBatteryTest = (phone) => {
        resetForm();
        setSelectedPhone(phone);
        
        // Находим ID последней инспекции для этого телефона, чтобы отправить тест
        const inspectionForPhone = awaitingBatteryTest.find(insp => insp.phone.id === phone.id);
        if (inspectionForPhone) {
            setCurrentInspection(inspectionForPhone);
        }
    };
    
    const handleResultChange = (itemId, field, value) => {
        setResults(prevResults => ({ ...prevResults, [itemId]: { ...prevResults[itemId], [field]: value } }));
    };

    // Отправка РЕЗУЛЬТАТОВ ЧЕК-ЛИСТА
    const handleSubmitChecklist = async (e) => {
        e.preventDefault();
        setMessage('Сохранение...');
        setError('');
        const submissionData = {
            serial_number: serialNumber,
            model_number: modelNumber,
            results: Object.keys(results).map(itemId => ({
                checklist_item_id: parseInt(itemId),
                result: results[itemId].result,
                notes: results[itemId].notes,
            }))
        };
        try {
            await submitInitialInspection(selectedPhone.id, submissionData);
            setMessage('Чек-лист сохранен! Телефон перемещен на тест аккумулятора.');
            resetForm();
            await loadData(); // Перезагружаем списки
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при сохранении чек-листа.');
            setMessage('');
        }
    };

    // Отправка РЕЗУЛЬТАТОВ ТЕСТА АККУМУЛЯТОРА
    const handleSubmitBatteryTest = async (e) => {
        e.preventDefault();
        setMessage('Сохранение...');
        setError('');
        const batteryData = {
            start_time: batteryTest.start_time || null,
            start_battery_level: parseInt(batteryTest.start_battery_level) || null,
            end_time: batteryTest.end_time || null,
            end_battery_level: parseInt(batteryTest.end_battery_level) || null,
        };
        try {
            // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ID ИЗ СОСТОЯНИЯ currentInspection
            await addBatteryTest(currentInspection.id, batteryData); 

            setMessage('Тест аккумулятора сохранен! Инспекция завершена.');
            resetForm();
            await loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при сохранении теста аккумулятора.');
            setMessage('');
        }
    };

    // --- 4. JSX-РАЗМЕТКА ---
    const handlePackagingCheckboxChange = (phoneId) => {
        setSelectedForPackaging(prev =>
            prev.includes(phoneId)
                ? prev.filter(id => id !== phoneId)
                : [...prev, phoneId]
        );
    };

    const handlePackageSubmit = async () => {
        if (selectedForPackaging.length === 0) {
            alert('Выберите хотя бы один телефон.');
            return;
        }
        setMessage('Обновление статусов...');
        try {
            await submitPackaging(selectedForPackaging);
            setMessage(`${selectedForPackaging.length} телефон(ов) отмечены как упакованные.`);
            setSelectedForPackaging([]);
            await loadData();
        } catch (err) {
            setError('Ошибка при обновлении статусов.');
            setMessage('');
        }
    };
    

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Инспекция Телефонов</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                
                {/* Левая колонка */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="order-page-container">
                        <h2>Ожидают проверки ({awaitingChecklist.length})</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {awaitingChecklist.map(phone => (
                                <li key={phone.id} onClick={() => handleSelectForChecklist(phone)} className="inspection-item">
                                    ID: {phone.id} - <strong>{phone.model?.name || 'Модель не указана'}</strong>
                                    <br />
                                    <small>S/N: {phone.serial_number || 'Не указан'}</small>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* --- БЛОК "НА УПАКОВКЕ" ТЕПЕРЬ ЗДЕСЬ --- */}
                    <div className="order-page-container">
                        <h2>На упаковке ({awaitingPackaging.length})</h2>
                        {awaitingPackaging.map(phone => (
                            <div key={phone.id} className="packaging-item">
                                <input
                                    type="checkbox"
                                    checked={selectedForPackaging.includes(phone.id)}
                                    onChange={() => handlePackagingCheckboxChange(phone.id)}
                                    id={`pack-${phone.id}`}
                                />
                                <label htmlFor={`pack-${phone.id}`}>
                                    ID: {phone.id} - <strong>{phone.model?.name || 'Модель не указана'}</strong>
                                    <br />
                                    <small>S/N: {phone.serial_number || 'Не указан'}</small>
                                </label>
                            </div>
                        ))}
                        {awaitingPackaging.length > 0 && (
                            <button
                                onClick={handlePackageSubmit}
                                className="btn btn-primary"
                                disabled={selectedForPackaging.length === 0}
                            >
                                Упаковано ({selectedForPackaging.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Центральная колонка */}
                <div style={{ flex: 2 }}>
                    {/* --- БЛОК "НА ТЕСТЕ АКБ" ТЕПЕРЬ ЗДЕСЬ --- */}
                    <div className="order-page-container">
                        <h2>На тесте аккумулятора ({awaitingBatteryTest.length})</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {awaitingBatteryTest.map(inspection => (
                                <li key={inspection.phone.id} onClick={() => handleSelectForBatteryTest(inspection.phone)} className="inspection-item">
                                    ID: {inspection.phone.id} - <strong>{inspection.phone.model?.name || 'Модель не указана'}</strong>
                                    <br />
                                    <small>S/N: {inspection.phone.serial_number || 'Не указан'}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>


                {/* Правая колонка с формой */}
                <div style={{ flex: 2 }}>
                    {!selectedPhone && (
                        <div className="order-page-container">
                            <p>Выберите телефон из списка слева, чтобы начать проверку.</p>
                        </div>
                    )}

                    {selectedPhone && awaitingChecklist.find(p => p.id === selectedPhone.id) && (
                        <div className="order-page-container">
                            <h2>Проверка телефона ID: {selectedPhone.id} (Этап 1: Чек-лист)</h2>
                            <p><strong>Модель:</strong> {selectedPhone.model?.name}</p>
                            <form onSubmit={handleSubmitChecklist}>
                                <div className="form-section">
                                    <label>Серийный номер (S/N):</label>
                                    <input type="text" className="form-input" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
                                </div>
                                <div className="form-section">
                                    <label>Номер модели:</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={modelNumber} 
                                        onChange={(e) => setModelNumber(e.target.value)}
                                        list="model-number-suggestions"
                                    />
                                    <datalist id="model-number-suggestions">
                                        {modelNumberSuggestions.map(suggestion => (
                                            <option key={suggestion.id} value={suggestion.name} />
                                        ))}
                                    </datalist>
                                </div>
                                                                <hr />
                                <h3>Чек-лист</h3>
                                {checklist.map(item => (
                                    <div key={item.id} className="checklist-item-wrapper">
                                        <div className="checklist-item">
                                            <span className="checklist-item-name">{item.name}</span>
                                            <div className="checklist-item-controls">
                                                <input 
                                                    type="radio" 
                                                    id={`pass-${item.id}`} 
                                                    name={`result-${item.id}`} 
                                                    checked={results[item.id]?.result === true} 
                                                    onChange={() => handleResultChange(item.id, 'result', true)} 
                                                />
                                                <label htmlFor={`pass-${item.id}`} style={{ fontWeight: 'normal' }}>Пройдено</label>
                                                
                                                <input 
                                                    type="radio" 
                                                    id={`fail-${item.id}`} 
                                                    name={`result-${item.id}`} 
                                                    checked={results[item.id]?.result === false} 
                                                    onChange={() => handleResultChange(item.id, 'result', false)} 
                                                />
                                                <label htmlFor={`fail-${item.id}`} style={{ fontWeight: 'normal' }}>Брак</label>
                                            </div>
                                        </div>

                                        {/* Поле для заметок остаётся без изменений и будет появляться под строкой */}
                                        {results[item.id]?.result === false && (
                                            <textarea
                                                className="form-input"
                                                placeholder="Опишите проблему..."
                                                value={results[item.id]?.notes || ''}
                                                onChange={(e) => handleResultChange(item.id, 'notes', e.target.value)}
                                                style={{ marginTop: '10px', minHeight: '60px', width: '100%' }}
                                            />
                                        )}
                                    </div>
                                ))}
                                {(() => {
                                    // Проверяем, есть ли хоть один пункт "Брак"
                                    const hasFailedChecks = Object.values(results).some(item => !item.result);

                                    return (
                                        <button 
                                            type="submit" 
                                            className={hasFailedChecks ? "btn btn-danger" : "btn btn-primary"}
                                        >
                                            {hasFailedChecks ? 'Зафиксировать брак' : 'Сохранить и отправить на тест АКБ'}
                                        </button>
                                    );
                                })()}
                            </form>
                        </div>
                    )}
                    
                    {selectedPhone && awaitingBatteryTest.find(p => p.phone.id === selectedPhone.id) && (
                        <div className="order-page-container">
                            <h2>Проверка телефона ID: {selectedPhone.id} (Этап 2: Тест аккумулятора)</h2>
                            <p><strong>Модель:</strong> {selectedPhone.model?.name}</p>
                            <form onSubmit={handleSubmitBatteryTest}>
                                <h3>Тест аккумулятора</h3>
                                <div className="details-grid">
                                    <div className="form-section">
                                        <label>Начальное время</label>
                                        <input type="datetime-local" className="form-input" value={batteryTest.start_time} onChange={(e) => setBatteryTest({...batteryTest, start_time: e.target.value})} />
                                    </div>
                                    <div className="form-section">
                                        <label>Начальный заряд (%)</label>
                                        <input type="number" className="form-input" value={batteryTest.start_battery_level} onChange={(e) => setBatteryTest({...batteryTest, start_battery_level: e.target.value})} />
                                    </div>
                                    <div className="form-section">
                                        <label>Конечное время</label>
                                        <input type="datetime-local" className="form-input" value={batteryTest.end_time} onChange={(e) => setBatteryTest({...batteryTest, end_time: e.target.value})} />
                                    </div>
                                    <div className="form-section">
                                        <label>Конечный заряд (%)</label>
                                        <input type="number" className="form-input" value={batteryTest.end_battery_level} onChange={(e) => setBatteryTest({...batteryTest, end_battery_level: e.target.value})} />
                                    </div>
                                </div>
                                {drainRate && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '0.5rem', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '500' }}>
                                            Расчётный расход: <strong>{drainRate} %/час</strong>
                                        </p>
                                    </div>
                                )}
                                <button type="submit" className="btn btn-primary">Завершить инспекцию</button>
                            </form>
                        </div>
                    )}

                    {error && <p className="form-message error">{error}</p>}
                    {message && <p className="form-message success">{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default InspectionPage;