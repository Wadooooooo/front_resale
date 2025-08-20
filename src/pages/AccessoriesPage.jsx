import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { getAllAccessories, getAccessoryCategories, createAccessory, getAccessoriesInStock, createAccessoryCategory } from '../api';
import './AccessoriesPage.css';
import './OrdersPage.css';

// Компонент для Select, который добавляет кнопку "+"
const ControlWithButton = ({ children, ...props }) => {
    const { onButtonClick } = props.selectProps;
    return (
        <components.Control {...props}>
            {children}
            <button type="button" onClick={onButtonClick} className="add-button-in-select">+</button>
        </components.Control>
    );
};

// Компонент модального окна для добавления записей
const Modal = ({ title, onClose, onSubmit, children }) => {
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>{title}</h3>
                <form onSubmit={onSubmit}>
                    {children}
                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function AccessoriesPage() {
    // Состояния для данных
    const [allAccessories, setAllAccessories] = useState([]);
    const [inStockAccessories, setInStockAccessories] = useState([]);
    const [categories, setCategories] = useState([]);

    // Состояния для UI
    const [activeTab, setActiveTab] = useState('inStock');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Состояние для формы
    const [newAccessory, setNewAccessory] = useState({
        name: '', barcode: '', category_accessory_id: '',
    });

    // Новые состояния для модального окна категорий
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [allAccData, inStockAccData, categoriesData] = await Promise.all([
                getAllAccessories(), getAccessoriesInStock(), getAccessoryCategories()
            ]);
            setAllAccessories(allAccData);
            setInStockAccessories(inStockAccData);
            setCategories(categoriesData);
        } catch (err) {
            setError('Не удалось загрузить данные.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAccessory(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMessage('Сохранение...');
        if (!newAccessory.name || !newAccessory.category_accessory_id) {
            setError('Название и категория обязательны для заполнения.');
            setMessage('');
            return;
        }
        try {
            const dataToSend = { ...newAccessory, category_accessory_id: parseInt(newAccessory.category_accessory_id) };
            await createAccessory(dataToSend);
            setMessage(`Аксессуар "${newAccessory.name}" успешно добавлен!`);
            setNewAccessory({ name: '', barcode: '', category_accessory_id: '' });
            await loadData();
        } catch (err) {
            setError('Ошибка при добавлении аксессуара.');
            setMessage('');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) { setError('Название категории не может быть пустым.'); return; }
        try {
            const newCategory = await createAccessoryCategory({ name: newCategoryName });
            setIsCategoryModalOpen(false);
            setNewCategoryName('');
            await loadData();
            setNewAccessory(prev => ({ ...prev, category_accessory_id: newCategory.id })); // Автоматически выбираем новую категорию
            setMessage(`Категория "${newCategory.name}" успешно добавлена.`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при создании категории.');
        }
    };
    
    const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            {isCategoryModalOpen && (
                <Modal title="Добавить новую категорию" onClose={() => setIsCategoryModalOpen(false)} onSubmit={handleCreateCategory}>
                    <div className="form-section">
                        <label>Название категории</label>
                        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="form-input" required autoFocus />
                    </div>
                </Modal>
            )}

            <h1>Аксессуары</h1>
            <div className="order-page-container">
                <h2>Добавить новый аксессуар</h2>
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Название*</label>
                            <input type="text" name="name" value={newAccessory.name} onChange={handleInputChange} className="form-input" required />
                        </div>
                        <div className="form-section">
                            <label>Категория*</label>
                            <Select
                                name="category_accessory_id"
                                options={categoryOptions}
                                value={categoryOptions.find(opt => opt.value === newAccessory.category_accessory_id)}
                                onChange={(selectedOption) => handleInputChange({ target: { name: 'category_accessory_id', value: selectedOption ? selectedOption.value : '' } })}
                                placeholder="-- Выберите категорию --"
                                components={{ Control: ControlWithButton }}
                                onButtonClick={() => setIsCategoryModalOpen(true)}
                                required
                            />
                        </div>
                        <div className="form-section">
                            <label>Штрих-код</label>
                            <input type="text" name="barcode" value={newAccessory.barcode} onChange={handleInputChange} className="form-input" />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Добавить аксессуар</button>
                    {error && <p className="form-message error">{error}</p>}
                    {message && <p className="form-message success">{message}</p>}
                </form>
            </div>
            <div className="order-page-container">
                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'inStock' ? 'active' : ''}`} onClick={() => setActiveTab('inStock')}>На складе ({inStockAccessories.length})</button>
                    <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Все аксессуары ({allAccessories.length})</button>
                </div>
                {activeTab === 'inStock' ? (<InStockTable accessories={inStockAccessories} />) : (<AllAccessoriesTable accessories={allAccessories} />)}
            </div>
        </div>
    );
}

// Компоненты InStockTable и AllAccessoriesTable остаются без изменений
    const InStockTable = ({ accessories }) => (
        <table className="orders-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Кол-во на складе</th>
                    <th>Цена закупки (посл.)</th>
                    <th>Розничная цена</th>
                    <th>Штрих-код</th>
                </tr>
            </thead>
            <tbody>
                {accessories.map(acc => (
                    <tr key={acc.id}>
                        <td>{acc.id}</td>
                        <td>{acc.name}</td>
                        <td>{acc.category_accessory?.name || 'Без категории'}</td>
                        <td><strong>{acc.quantity} шт.</strong></td>
                        <td>{acc.purchase_price ? `${acc.purchase_price} руб.` : '-'}</td>
                        <td>{acc.current_price ? `${acc.current_price} руб.` : 'Нет цены'}</td>
                        <td>{acc.barcode || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const AllAccessoriesTable = ({ accessories }) => (
        <table className="orders-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Цена закупки (посл.)</th>
                    <th>Розничная цена</th>
                    <th>Штрих-код</th>
                </tr>
            </thead>
            <tbody>
                {accessories.map(acc => (
                    <tr key={acc.id}>
                        <td>{acc.id}</td>
                        <td>{acc.name}</td>
                        <td>{acc.category_accessory?.name || 'Без категории'}</td>
                        <td>{acc.purchase_price ? `${acc.purchase_price} руб.` : '-'}</td>
                        <td>{acc.current_price ? `${acc.current_price} руб.` : 'Нет цены'}</td>
                        <td>{acc.barcode || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
export default AccessoriesPage;