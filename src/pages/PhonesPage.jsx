// src/pages/PhonesPage.jsx

// ... (импорты и другие компоненты остаются без изменений) ...
import React, { useState, useEffect, useMemo } from 'react';
import { getPhones, getModelColorCombos, updateImageForModelColor } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './OrdersPage.css';
import './AccessoriesPage.css';

const EditModelModal = ({ model, onClose, onSave }) => {
    const [imageUrl, setImageUrl] = useState(model.image_url || '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave({ 
            model_name_id: model.model_name_id,
            color_id: model.color_id,
            image_url: imageUrl 
        });
    };

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                <h3>Редактировать фото для модели</h3>
                <p><strong>{model.model_name} ({model.color_name})</strong></p>
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label>Ссылка на фото (URL)</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="form-input"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div className="confirm-modal-buttons">
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PhoneListTab = () => {
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPhones = async () => {
            try {
                const phonesData = await getPhones();
                setPhones(phonesData.sort((a, b) => b.id - a.id));
            } catch (err) {
                console.error('Ошибка при загрузке телефонов:', err);
                if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchPhones();
    }, [navigate]);

    if (loading) return <h4>Загрузка списка телефонов...</h4>;

    return (
        <table className="orders-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Модель</th>
                    <th>S/N</th>
                    <th>Коммерческий статус</th>
                </tr>
            </thead>
            <tbody>
                {phones.map(phone => (
                    <tr key={phone.id}>
                        <td>{phone.id}</td>
                        <td>{phone.model?.name || '-'}</td>
                        <td>
                            {phone.serial_number ? (
                                <Link to={`/phone-history/${phone.serial_number}`} className="clickable-sn">
                                    {phone.serial_number}
                                </Link>
                            ) : (
                                '-'
                            )}
                        </td>
                        <td>{phone.commercial_status || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


// Вкладка "Управление моделями" (ОБНОВЛЕНА)
const ModelManagementTab = () => {
    const [modelColorCombos, setModelColorCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingModel, setEditingModel] = useState(null);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getModelColorCombos();
            setModelColorCombos(data);
        } catch (err) {
            console.error("Ошибка:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (updateData) => {
        try {
            await updateImageForModelColor(updateData);
            setMessage('Фотография успешно обновлена для всей группы!');
            setEditingModel(null);
            await loadData();
        } catch (err) {
            alert('Не удалось сохранить изменения.');
        }
    };

    // 1. УЛУЧШЕННАЯ ЛОГИКА СОРТИРОВКИ
    const sortedAndFilteredCombos = useMemo(() => {
        // Функция, которая присваивает "очки" каждой модели для сортировки
        const getSortScore = (name) => {
            // Список поколений от старых к новым. Длинные названия должны идти раньше!
            const ranks = [
                'iPhone 6S', 'iPhone SE', 'iPhone 7', 'iPhone 8', 'iPhone X', 
                'iPhone XR', 'iPhone XS', 'iPhone 11', 'iPhone SE 2020', 'iPhone 12', 
                'iPhone 13', 'iPhone SE 2022', 'iPhone 14', 'iPhone 15', 'iPhone 16'
            ];
            
            // Находим, к какому поколению относится модель
            // Идем с конца, чтобы найти самое новое поколение в названии
            for (let i = ranks.length - 1; i >= 0; i--) {
                if (name.includes(ranks[i])) {
                    let score = i;
                    // Добавляем микро-очки для Pro/Max, чтобы они были выше базовых моделей
                    if (name.includes('Pro Max')) score += 0.3;
                    else if (name.includes('Pro')) score += 0.2;
                    else if (name.includes('Plus')) score += 0.1;
                    return score;
                }
            }
            return -1; // Для моделей, не попавших в список
        };

        return modelColorCombos
            .filter(combo =>
                combo.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                combo.color_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => getSortScore(b.model_name) - getSortScore(a.model_name));
    }, [modelColorCombos, searchTerm]);

    if (loading) return <h4>Загрузка моделей...</h4>;

    return (
        <div>
            {message && <p className="form-message success">{message}</p>}
            {editingModel && (
                <EditModelModal
                    model={editingModel}
                    onClose={() => setEditingModel(null)}
                    onSave={handleSave}
                />
            )}

            <div className="form-section" style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Поиск по модели или цвету..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Название модели</th>
                        <th>Цвет</th>
                        <th>Ссылка на фото</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                    {/* 2. Используем новый отсортированный список */}
                    {sortedAndFilteredCombos.map(combo => (
                        <tr key={`${combo.model_name_id}-${combo.color_id}`}>
                            <td>{combo.model_name}</td>
                            <td>{combo.color_name}</td>
                            <td>{combo.image_url || 'Не задана'}</td>
                            <td>
                                <button onClick={() => setEditingModel(combo)} className="btn btn-secondary btn-compact">
                                    Изменить фото
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ... (основной компонент PhonesPage остается без изменений) ...
function PhonesPage() {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div>
            <h1>Телефоны</h1>
            <div className="order-page-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        Список телефонов
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                    >
                        Управление моделями
                    </button>
                </div>
                {activeTab === 'list' ? <PhoneListTab /> : <ModelManagementTab />}
            </div>
        </div>
    );
}

export default PhonesPage;