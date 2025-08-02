import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
    getUniqueModelNames, 
    getAllAccessoriesInfo, 
    getAccessoryModelLinks, 
    linkAccessoryToModel, 
    unlinkAccessoryFromModel 
} from '../api';
import './OrdersPage.css';

function AccessoryCompatibilityPage() {
    const [models, setModels] = useState([]);
    const [accessories, setAccessories] = useState([]);
    const [links, setLinks] = useState([]);

    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedAccessory, setSelectedAccessory] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [modelsData, accessoriesData, linksData] = await Promise.all([
                getUniqueModelNames(),
                getAllAccessoriesInfo(),
                getAccessoryModelLinks()
            ]);
            setModels(modelsData);
            setAccessories(accessoriesData);
            setLinks(linksData);
        } catch (err) {
            setError('Не удалось загрузить данные для настройки совместимости.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedModel || !selectedAccessory) {
            setError('Пожалуйста, выберите и модель, и аксессуар.');
            return;
        }
        setError('');
        setMessage('Создание связи...');

        try {
            const linkData = {
                model_name_id: selectedModel.value,
                accessory_id: selectedAccessory.value
            };
            const newLink = await linkAccessoryToModel(linkData);
            setLinks(prev => [...prev, newLink]);
            setMessage(`Связь успешно создана!`);
            setSelectedAccessory(null); // Сбрасываем только аксессуар для удобства
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при создании связи.');
            setMessage('');
        }
    };

    const handleUnlink = async (linkId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту связь?')) {
            try {
                await unlinkAccessoryFromModel(linkId);
                setLinks(prev => prev.filter(link => link.id !== linkId));
                setMessage('Связь удалена.');
            } catch (err) {
                setError('Ошибка при удалении связи.');
            }
        }
    };

    const modelOptions = models.map(m => ({ value: m.id, label: m.name }));
    const accessoryOptions = accessories.map(a => ({ value: a.id, label: a.name }));

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            <h1>Настройка Совместимости Аксессуаров</h1>

            <div className="order-page-container">
                <h2>Создать новую связь</h2>
                <form onSubmit={handleLinkSubmit}>
                    <div className="details-grid">
                        <div className="form-section">
                            <label>Модель телефона:</label>
                            <Select options={modelOptions} value={selectedModel} onChange={setSelectedModel} placeholder="Выберите модель..." isClearable filterOption={({ label }, query) => label.toLowerCase().includes(query.toLowerCase())}/>
                        </div>
                        <div className="form-section">
                            <label>Совместимый аксессуар:</label>
                            <Select options={accessoryOptions} value={selectedAccessory} onChange={setSelectedAccessory} placeholder="Выберите аксессуар..." isClearable />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Связать</button>
                    {error && <p className="form-message error">{error}</p>}
                    {message && <p className="form-message success">{message}</p>}
                </form>
            </div>

            <div className="order-page-container">
                <h2>Существующие связи</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Модель телефона</th>
                            <th>Аксессуар</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {links.map(link => (
                            <tr key={link.id}>
                                <td>{link.model_name}</td>
                                <td>{link.accessory_name}</td>
                                <td>
                                    <button onClick={() => handleUnlink(link.id)} className="btn btn-danger btn-compact">
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AccessoryCompatibilityPage;