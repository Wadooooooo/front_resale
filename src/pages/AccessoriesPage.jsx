import React, { useState, useEffect } from 'react';
import { getAllAccessories, getAccessoryCategories, createAccessory, getAccessoriesInStock } from '../api';
import './AccessoriesPage.css'; // Создадим специальный CSS для этой страницы
import './OrdersPage.css'; // Используем и старые стили

function AccessoriesPage() {
    // Состояния для данных
    const [allAccessories, setAllAccessories] = useState([]);
    const [inStockAccessories, setInStockAccessories] = useState([]);
    const [categories, setCategories] = useState([]);

    // Состояния для UI
    const [activeTab, setActiveTab] = useState('inStock'); // 'inStock' будет вкладкой по умолчанию
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Состояние для формы
    const [newAccessory, setNewAccessory] = useState({
        name: '',
        barcode: '',
        category_accessory_id: '',
    });

    const loadData = async () => {
        try {
            setLoading(true);
            // Загружаем сразу всё: все аксессуары, те что на складе, и категории
            const [allAccData, inStockAccData, categoriesData] = await Promise.all([
                getAllAccessories(),
                getAccessoriesInStock(),
                getAccessoryCategories()
            ]);
            setAllAccessories(allAccData);
            setInStockAccessories(inStockAccData);
            setCategories(categoriesData);
        } catch (err) {
            setError('Не удалось загрузить данные.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAccessory(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('Сохранение...');

        if (!newAccessory.name || !newAccessory.category_accessory_id) {
            setError('Название и категория обязательны для заполнения.');
            setMessage('');
            return;
        }

        try {
            const dataToSend = {
                ...newAccessory,
                category_accessory_id: parseInt(newAccessory.category_accessory_id),
            };
            await createAccessory(dataToSend);
            setMessage(`Аксессуар "${newAccessory.name}" успешно добавлен!`);

            setNewAccessory({ name: '', barcode: '', category_accessory_id: '' });
            await loadData(); // Перезагружаем все данные

        } catch (err) {
            setError('Ошибка при добавлении аксессуара.');
            setMessage('');
            console.error(err);
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Аксессуары</h1>

            <div className="order-page-container">
                <h2>Добавить новый аксессуар</h2>
                {/* ... (Форма остается без изменений) ... */}
                <form onSubmit={handleSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Название*</label>
                            <input type="text" name="name" value={newAccessory.name} onChange={handleInputChange} className="form-input" required />
                        </div>
                        <div className="form-section">
                            <label>Категория*</label>
                            <select name="category_accessory_id" value={newAccessory.category_accessory_id} onChange={handleInputChange} className="form-select" required>
                                <option value="">-- Выберите категорию --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
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
                {/* НАВИГАЦИЯ ПО ВКЛАДКАМ */}
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'inStock' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inStock')}
                    >
                        На складе ({inStockAccessories.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Все аксессуары ({allAccessories.length})
                    </button>
                </div>

                {/* ОТОБРАЖЕНИЕ АКТИВНОЙ ВКЛАДКИ */}
                {activeTab === 'inStock' ? (
                    <InStockTable accessories={inStockAccessories} />
                ) : (
                    <AllAccessoriesTable accessories={allAccessories} />
                )}
            </div>
        </div>
    );
}

// Компонент для таблицы "На складе"
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

// Компонент для таблицы "Все аксессуары"
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